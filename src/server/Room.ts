import { WebSocket } from 'ws';
import { type ChatMessage, type GameSettings, type LoginResponse, type NewRoundMessage, type ChooseWordMessage, type OwnerChangeMessage, type Player, type PlayerJoinMessage, type PlayerLeaveMessage, type TurnEndMessage, type TurnStartMessage, type SendChatMessage, type WordChosenMessage, type GameState, type RevealHintMessage, type GameEndMessage, type DrawInstruction, ErrorCode, MessageType, DrawType, defaultSettings, PlayerGuessedMessage, ClientMessage, ServerMessage } from '../shared/draw-v1';
import EventEmitter from 'node:events';
import { arrayCount, delay, round } from './utils';

type ServerPlayer = Player & { client: WebSocket };

export class Room extends EventEmitter {
  id: string;
  settings = structuredClone(defaultSettings);
  #nextNewPlayerId = 0;
  players: ServerPlayer[] = [];
  #gameState: GameState = 'none';
  #currentPlayer: number = -1;
  #roomOwner: number = -1;
  #round = -1;
  #currentWord: string | null = null;
  #timerExpires: number = -1;
  #timerStart: number = -1;
  #wordHint: string | null = null;
  #abortController: AbortController | undefined;

  constructor(id: string) {
    super();
    this.id = id;
  }

  public newClient(
    { name, avatar_bg, avatar }: {
      name: string,
      avatar_bg: number
      avatar: DrawInstruction[],
    },
    ws: WebSocket
  ) {
    const id = this.#nextNewPlayerId++;
    const player = { id, name, score: 0, client: ws, has_guessed: false, avatar, avatar_bg };
    this.players.push(player)

    if (this.players.length === 1) {
      this.#roomOwner = 0;
    }

    const loginMsg: LoginResponse = {
      type: MessageType.LOGIN_RESPONSE,
      draw_instructions: [
        { type: DrawType.MOVE, x: 50, y: 410 },
        { type: DrawType.DRAW_LINE, color: 2, x: 590, y: 50, width: 200 },
        { type: DrawType.MOVE, x: 50, y: 50 },
        { type: DrawType.DRAW_LINE, color: 5, x: 590, y: 410, width: 200 },
        { type: DrawType.MOVE, x: 50, y: 50 },
        { type: DrawType.QUADRATIC_CURVE, color: 9, cx: 250, cy: 50, x: 250, y: 250, width: 15 },

      ],
      me: id,
      owner: this.#roomOwner,
      players: [...this.players.values()].map(p => ({
        id: p.id,
        has_guessed: p.has_guessed,
        name: p.name,
        score: p.score,
        avatar: p.avatar,
        avatar_bg: p.avatar_bg
      })),
      room_id: this.id,
      settings: this.settings,
      current_player: this.#currentPlayer,
      round: this.#round,
      timer: {
        start: this.#timerStart,
        expires: this.#timerExpires
      },
      word_hint: this.#wordHint ?? '',
      state: this.#gameState
    };

    this.messagePlayer(id, loginMsg);

    this.messageOtherPlayers(id, { type: MessageType.PLAYER_JOIN, id, name, avatar, avatar_bg });

    this.emit('player-join', player);
  }

  public removeClient(ws: WebSocket, reason: 'left' | 'kick') {
    const player = this.getPlayer(ws)!;
    this.players = this.players.filter(p => p.client !== ws);

    let willHostChange = false;
    if (this.#roomOwner === player.id) {
      willHostChange = true;
    }

    this.messageAllPlayers({ type: MessageType.PLAYER_LEAVE, reason, id: player.id });
    this.emit('player-left', player, true);

    if (willHostChange) {
      this.#roomOwner = this.players[0]?.id ?? -1;
      this.messageAllPlayers({
        type: MessageType.OWNER_CHANGE,
        player_id: this.#roomOwner
      });
    }

    if (this.players.length < 2 && this.#gameState !== 'none') {
      // Handle cancellation of game, ready for destruction.
      this.stopGame();
      return;
    }

    if (this.#currentPlayer === player.id) {
      this.emit('current-player-left', player);
    }
  }

  private chooseNextPlayer() {
    if (this.#currentPlayer === -1) {
      this.#currentPlayer = this.players.at(-1)!.id;
    } else {
      this.#currentPlayer = this.players.find(p => p.id < this.#currentPlayer)?.id ?? this.players.at(-1)!.id;
    }
  }

  public stopGame() {
    this.#gameState = 'none';
    this.#abortController?.abort('stop-game');
    this.messageAllPlayers({ type: MessageType.STOP });
  }

  /**
   * Begins the main game timeline.
   */
  public startGame() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.#abortController = new AbortController();

        this.#abortController.signal.addEventListener('abort', () => {
          reject(this.#abortController?.signal.reason);
        });

        if (this.players.length < 2) {
          this.messagePlayer(this.#roomOwner, {
            type: MessageType.ERROR,
            code: ErrorCode.NOT_ENOUGH_PLAYERS
          });
          return;
        }

        this.#currentPlayer = -1;

        for (this.#round = 1; this.#round <= this.settings.rounds_per_game; this.#round++) {

          const time = 2000;
          this.#timerStart = Date.now();
          this.#timerExpires = this.#timerStart + time;

          const roundMsg: NewRoundMessage = {
            type: MessageType.NEW_ROUND,
            round: this.#round,
            timer: {
              start: this.#timerStart,
              expires: this.#timerExpires
            }
          };

          this.messageAllPlayers(roundMsg);

          await delay(time, this.#abortController.signal);

          for (let i = this.players.length - 1; i >= 0; i--) {
            this.chooseNextPlayer();
            await this.singleTurn(this.#abortController.signal);
          }
        }

        this.#gameState = 'end-game';

        const gameEndMsg: GameEndMessage = {
          type: MessageType.GAME_END,
          scores: this.players.map(p => ({ player_id: p.id, points: p.score }))
        };

        this.messageAllPlayers(gameEndMsg);
        await delay(5000, this.#abortController.signal);
        resolve();
      }
      catch (e) {
        if (e === 'stop-game') return;
        throw e;
      }
    });
  }

  private singleTurn(signal: AbortSignal) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        signal.addEventListener('abort', () => {
          reject(signal.reason)
        });

        const words = this.generateWords();
        this.#gameState = 'choosing-word';
        this.#currentWord = await this.promptChoseWord(words, signal);
        this.#timerStart = Date.now();
        this.#timerExpires = this.#timerStart + this.settings.timer * 1000;
        this.#wordHint = this.#currentWord.replace(/\w/g, '_');

        const roundStartMsg: TurnStartMessage = {
          type: MessageType.TURN_START,
          current_player_id: this.#currentPlayer,
          word_hint: this.#wordHint,
          timer: {
            start: this.#timerStart,
            expires: this.#timerExpires
          }
        };

        this.#gameState = 'in-turn';
        this.messageOtherPlayers(this.#currentPlayer, roundStartMsg);
        roundStartMsg.word_hint = this.#currentWord;
        this.messagePlayer(this.#currentPlayer, roundStartMsg);

        const scoreMsg = await this.runRound(this.#currentWord, signal);

        this.#wordHint = this.#currentWord;
        this.#gameState = 'end-turn';
        scoreMsg.scores.forEach(s => {
          const player = this.players.find(p => p.id === s.player_id)!;
          player.score += s.points;
          player.has_guessed = false;
        });

        const time = 5000;
        this.#timerStart = Date.now();
        this.#timerExpires = this.#timerStart + time;

        scoreMsg.timer.start = this.#timerStart;
        scoreMsg.timer.expires = this.#timerExpires;

        this.messageAllPlayers(scoreMsg);
        await delay(time, signal);
        resolve();
      }
      catch (e) {
        if (e === 'stop-game') return;
        throw e;
      }
    });
  }

  private generateWords(): string[] {
    return ['hello', 'world', 'javascript'];
  }

  private async runRound(word: string, signal: AbortSignal): Promise<TurnEndMessage> {

    this.players.forEach(p => p.has_guessed = false);
    const scores = new Map<Player, number>();
    this.players.forEach(p => scores.set(p, 0));
    const getScores = (): { player_id: number, points: number }[] => {
      return [...scores.entries()]
        .map(([p, s]) => ({ player_id: p.id, points: s }));
    };

    const maxHints = Math.min(this.settings.max_hints, Math.round(word.length / 2));
    const hintRate = Math.max(this.settings.timer / maxHints, 10);

    return await new Promise((resolve, reject) => {
      const removeListeners = () => {
        clearTimeout(roundEndTimeout);
        clearInterval(hintInterval);
        this.off('current-player-left', currentPlayerLeftHandler);
        this.off('player-guessed', playerGuessedHandler);
        this.off('player-join', playerJoinHandler);
        this.off('player-left', playerLeftHandler);
      };

      signal.addEventListener('abort', () => {
        removeListeners();
        reject(signal.reason);
      })

      const roundEndTimeout = setTimeout(() => {
        clearInterval(hintInterval);
        resolve({
          type: MessageType.TURN_END,
          reason: 'time-out',
          scores: getScores(),
          word,
          timer: {
            start: -1,
            expires: -1
          }
        })
      }, this.settings.timer * 1000);

      let hints = -1;
      const hintInterval = setInterval(() => {
        if (hints > maxHints) {
          clearInterval(hintInterval);
          return;
        }

        if (this.#currentWord && this.#wordHint) {
          const chars = this.#wordHint.split('');
          while (true) {
            const char = Math.floor(Math.random() * chars.length);
            if (chars[char] !== '_') continue;

            chars[char] = this.#currentWord[char]!;
            this.#wordHint = chars.join('');
            const msg: RevealHintMessage = {
              type: MessageType.REVEAL_HINT,
              word_hint: this.#wordHint
            };
            this.messageOtherPlayers(this.#currentPlayer, msg);

            break;
          }
        }
      }, hintRate * 1000);

      const currentPlayerLeftHandler = (player: Player) => {
        scores.delete(player);
        removeListeners();
        resolve({
          type: MessageType.TURN_END,
          reason: 'left',
          scores: getScores(),
          word,
          timer: {
            start: -1,
            expires: -1
          }
        });
      };

      this.on('current-player-left', currentPlayerLeftHandler);

      const checkIfAnyLeft = (player: Player, last?: boolean) => {

        const left = arrayCount(this.players, p => !p.has_guessed && p.id !== this.#currentPlayer);

        if (left <= this.players.length * 2 / 3) {
          const currentPlayer = this.players.find(p => p.id === this.#currentPlayer)!;
          scores.set(currentPlayer, this.calculateScore(true));
        }

        if (!last && !left) {
          removeListeners();
          resolve({
            type: MessageType.TURN_END,
            reason: 'guessed',
            scores: getScores(),
            word,
            timer: {
              start: -1,
              expires: -1
            }
          });
        }
      };

      const playerGuessedHandler = (player: Player) => {
        scores.set(player, this.calculateScore());
        checkIfAnyLeft(player);
      };

      this.on('player-guessed', playerGuessedHandler);

      const playerJoinHandler = (player: Player) => {
        scores.set(player, 0);
        checkIfAnyLeft(player);
      };

      this.on('player-join', playerJoinHandler);

      const playerLeftHandler = (player: Player, last: boolean) => {
        scores.delete(player);
        checkIfAnyLeft(player, last);
      };

      this.on('player-left', playerLeftHandler);
    });
  }

  /**
   * Calculate score based on the current timer value.
   */
  private calculateScore(isCurrent: boolean = false): number {
    const now = new Date();
    const diff = (this.#timerExpires.valueOf() - now.valueOf()) / 1000;
    const progress = diff / this.settings.timer;

    const currentOffset = (isCurrent ? 1 : 0);
    const left = arrayCount(this.players, p => !p.has_guessed) - currentOffset;
    const proportion = left / this.players.length;

    console.log(progress, left, proportion);
    return 100 + round(progress * 400 * proportion + 100 * currentOffset, 50);
  }

  private promptChoseWord(words: string[], signal: AbortSignal): Promise<string> {

    this.#timerStart = Date.now();
    this.#timerExpires = this.#timerStart + this.settings.choose_word_timer * 1000;
    const msg: ChooseWordMessage = {
      type: MessageType.CHOOSE_WORD,
      current_player_id: this.#currentPlayer,
      timer: {
        start: this.#timerStart,
        expires: this.#timerExpires
      },
      words
    };

    this.messagePlayer(this.#currentPlayer, msg);

    delete msg.words;
    this.messageOtherPlayers(this.#currentPlayer, msg);

    return new Promise<string>((resolve, reject) => {
      try {
        const removeListeners = () => {
          clearTimeout(timeout);
          this.off('word-chosen', wordChosenHandler);
          this.off('current-player-left', currentPlayerLeftHandler);
        };

        signal.addEventListener('abort', () => {
          removeListeners();
          reject(signal.reason);
        });

        const timeout = setTimeout(() => {
          removeListeners();
          resolve(words[Math.floor(Math.random() * words.length)]!);
        }, this.settings.choose_word_timer * 1000);

        const wordChosenHandler = (player: Player, msg: WordChosenMessage) => {
          removeListeners();
          if (msg.word_index < words.length) {
            resolve(words[msg.word_index]!);
          }
        };

        this.on('word-chosen', wordChosenHandler);

        const currentPlayerLeftHandler = (player: Player) => {
          removeListeners();
          resolve(words[Math.floor(Math.random() * words.length)]!);
        };

        this.on('current-player-left', currentPlayerLeftHandler);
      }
      catch (e) {
        if (e === 'stop-game') return;
        throw e;
      }
    });
  }

  public handleMessage(ws: WebSocket, msg: ClientMessage) {

    switch (msg.type) {
      case MessageType.WORD_CHOSEN:
        this.handleWordChosen(ws, msg);
        break;

      case MessageType.SEND_CHAT:
        this.handleIncomingChat(ws, msg);
        break;

      case MessageType.START_GAME:
        if (ws === this.getClient(this.#roomOwner)) {
          if (this.#gameState === 'none') {
            this.startGame()
              .catch(e => e !== 'stop-game'
                ? Promise.reject(e)
                : Promise.resolve());
          }
        } else {
          this.messagePlayer(ws, {
            type: MessageType.ERROR,
            code: ErrorCode.NOT_PERMITTED
          });
        }
        break;

      case MessageType.DRAW:
        if (ws === this.getClient(this.#currentPlayer) && this.#gameState === 'in-turn') {
          this.messageOtherPlayers(this.#currentPlayer, msg);
        }
        break;

      case MessageType.STOP:
        this.stopGame();
        break;

      case MessageType.LOGIN_REQUEST:
        break;

      default:
        ws.send(JSON.stringify({
          type: MessageType.ERROR,
          code: ErrorCode.INVALID_MESSAGE,
          detail: (msg as ClientMessage).type
        }));
        const guard: never = msg;
        break;
    }
  }

  private getClient(id: number) {
    return this.players.find(p => p.id === id)?.client;
  }

  private getPlayer(client: WebSocket) {
    return this.players.find(p => p.client === client);
  }

  private handleWordChosen(client: WebSocket, msg: WordChosenMessage) {
    const player = this.getPlayer(client)!;
    this.emit('word-chosen', player, msg);
  }

  private handleIncomingChat(ws: WebSocket, msg: SendChatMessage) {
    const player = this.getPlayer(ws)!;
    const guessed = this.players.filter(p => p.has_guessed || p.id === this.#currentPlayer);

    if (!guessed.some(p => p.id === player.id)) {
      const word = this.#currentWord?.toLowerCase();
      const guess = msg.content.trim().toLowerCase();

      if (word && word === guess) {
        player.has_guessed = true;
        const guessedMsg: PlayerGuessedMessage = {
          type: MessageType.PLAYER_GUESSED,
          player_id: player.id,
        };
        this.messageOtherPlayers(player.id, guessedMsg);
        guessedMsg.word = this.#currentWord!;
        this.messagePlayer(player.id, guessedMsg);
        this.emit('player-guessed', player);
      }
      else if (word && guess && this.isGuessClose(word, guess)) {
        this.messageOtherPlayers(player.id, {
          type: MessageType.CHAT,
          player_id: player.id,
          content: guess
        });
        this.messagePlayer(player.id, {
          type: MessageType.ALMOST,
          word: guess
        });
      }
      else {
        this.messageAllPlayers({
          type: MessageType.CHAT,
          player_id: player.id,
          content: msg.content
        });
      }
    }
    else {
      this.messageSpecifiedPlayers(guessed.map(p => p.id), {
        type: MessageType.CHAT,
        player_id: player.id,
        content: msg.content
      });
    }
  }

  private isGuessClose(word: string, guess: string): boolean {
    if (Math.abs(word.length - guess.length) > 1) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < word.length || i < guess.length; i++) {
      if (word[i] !== guess[i]) {
        diff++;
      }
    }

    return diff < 3;
  }

  private messageAllPlayers(msg: ServerMessage) {
    const json = JSON.stringify(msg);
    this.players
      .forEach(p => {
        p.client.send(json)
      });
  }

  private messagePlayer(player: Player | number | WebSocket, msg: ServerMessage) {

    let client: WebSocket | undefined;

    if (typeof player === 'number') {
      client = this.getClient(player);
    }
    else if ('id' in player) {
      client = this.getClient(player.id);
    }
    else {
      client = player;
    }

    client?.send(JSON.stringify(msg));
  }

  private messageOtherPlayers(player: number | Player, msg: ServerMessage) {
    const id = typeof player === 'object' ? player.id : player;
    const json = JSON.stringify(msg);
    this.players
      .filter(p => p.id !== id)
      .forEach(p => p.client.send(json));
  }

  private messageSpecifiedPlayers(players: number[] | Player[], msg: ServerMessage) {
    const ids = players.map(p => typeof p === 'object' ? p.id : p);
    const json = JSON.stringify(msg);
    this.players
      .filter(p => ids.includes(p.id))
      .forEach(p => p.client.send(json));
  }
}
