<script setup lang="ts">
import PlayerInfo from '@/components/PlayerInfo.vue';
import ChatMessageComponent from '@/components/ChatMessage.vue';
import type { ChatItem } from '@/components/ChatMessage.vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { type GameState, type DrawInstruction, type DrawMessage, type LoginRequest, type LoginResponse, type Player, type SendChatMessage, type StartGameMessage, type WordChosenMessage, MessageType, ErrorCode, defaultSettings, type ServerMessage, type ClientMessage } from '../../shared/draw-v1';
import MessageContainer from '@/components/MessageContainer.vue';
import { clamp, localGet, unhandled } from '@/utils';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { InputText, Button, Dialog, FloatLabel, InputNumber } from 'primevue';
import MaterialIcon from '@/components/MaterialIcon.vue';
import Grid from '@/components/containers/Grid.vue';
import DrawCanvas from '@/components/DrawCanvas.vue';
import DrawCanvasControls from '@/components/DrawCanvasControls.vue';

const props = defineProps<{
  room: string
}>();

const root = ref<HTMLElement>();

onMounted(() => {
  const elm = document.querySelector('#app > .page-wrapper .game-area');
  if (elm) {
    setTimeout(() => resize({ height: elm.clientHeight }), 0);
    setTimeout(() => resize({ height: elm.clientHeight }), 500);
  }
});

const websocket = new WebSocket(location.origin.replace('http', 'ws'), 'draw-v1');
const canSendChat = ref(false);

websocket.onopen = (e) => {
  const name = localGet<string>('name', 'no name');
  const avatar = JSON.parse(localStorage.getItem('avatar') ?? '[]');
  const avatar_bg = JSON.parse(localStorage.getItem('avatar_bg') ?? '2');
  const msg: LoginRequest = {
    type: MessageType.LOGIN_REQUEST,
    room_id: props.room,
    name,
    avatar,
    avatar_bg
  };
  websocket.send(JSON.stringify(msg));
};

onUnmounted(() => {
  websocket.close();
});

const timeLeft = ref(0);

const players = ref<(Player & { newScore?: number })[]>([]);
const current = ref(0);
const roomOwner = ref(-1);
const me = ref(-1);
const round = ref(-1);

function findPlayer(id: number) {
  return players.value.find(p => p.id === id);
}

const currentPlayer = computed(() => {
  return findPlayer(current.value);
});

const wordHint = ref('');
const endReason = ref('');
const state = ref<GameState>();

const leaderboard = computed<[number, Player][]>(() => {
  let prevScore = -1;
  let position = 0;
  return [...players.value]
    .sort((a, b) => (a.score - b.score) || (a.id - b.id))
    .map(p => [
      p.score > prevScore
        ? (prevScore = p.score, ++position)
        : position,
      p
    ]);
});

function resetPlayers(alsoScore?: boolean) {
  players.value.forEach(p => {
    if (alsoScore) p.score = 0;
    p.has_guessed = false;
    delete p.newScore;
  })
}

watch(state, () => {
  switch (state.value) {
    case 'new-round':
      messageScreen.value = 'round';
      break;

    case 'choosing-word':
      messageScreen.value = me.value === current.value
        ? 'choose-word'
        : 'choosing-word';
      resetPlayers();
      break;

    case 'end-turn':
      messageScreen.value = 'leaderboard';
      break;

    case 'end-game':
      messageScreen.value = 'final-leaderboard';
      current.value = -1;
      applyTimer(-1, -1);
      resetPlayers();
      break;

    case 'in-turn':
      canvas.value?.clear();
      messageScreen.value = '';
      break;

    case 'none':
    case undefined:
      messageScreen.value = 'waiting-for-host';
      applyTimer(-1, -1);
      resetPlayers(true);
      current.value = -1;
      wordHint.value = 'Please wait...';
      break;

    default:
      unhandled(state.value);
  }
});

websocket.onmessage = e => {
  const msg = JSON.parse(e.data.toString()) as ServerMessage;
  switch (msg.type) {
    case MessageType.LOGIN_RESPONSE:
      applyState(msg);
      break;

    case MessageType.PLAYER_JOIN: {
      const player = {
        id: msg.id,
        name: msg.name,
        score: 0,
        has_guessed: false,
        avatar: msg.avatar,
        avatar_bg: msg.avatar_bg
      };
      players.value.push(player);
      addChatMessage({ player, kind: 'join' });
      break;
    }

    case MessageType.PLAYER_LEAVE:
      addChatMessage({ player: findPlayer(msg.id)!, kind: 'left' });
      players.value = players.value.filter(p => p.id !== msg.id);
      break;

    case MessageType.OWNER_CHANGE:
      roomOwner.value = msg.player_id;
      addChatMessage({
        kind: 'host-change',
        player: findPlayer(msg.player_id)!,
        me: msg.player_id === me.value
      });
      break;

    case MessageType.CHAT: {
      const player = findPlayer(msg.player_id)!;
      addChatMessage({
        kind: 'chat',
        player,
        content: msg.content,
        me: player.id === me.value,
        guessed: player.has_guessed
      });
      break;
    }

    case MessageType.PLAYER_GUESSED: {
      const player = findPlayer(msg.player_id)!;
      addChatMessage({
        kind: 'guess',
        player,
        me: player.id === me.value
      });
      player.has_guessed = true;
      break;
    }

    case MessageType.ALMOST:
      addChatMessage({ kind: 'almost', word: msg.word });
      break;

    case MessageType.NEW_ROUND:
      round.value = msg.round;
      state.value = 'new-round';
      applyTimer(msg.timer.expires, msg.timer.start);
      break;

    case MessageType.CHOOSE_WORD:
      current.value = msg.current_player_id;
      applyTimer(msg.timer.expires, msg.timer.start);
      wordOptions.value = msg.words ?? [];
      state.value = 'choosing-word';
      break;

    case MessageType.TURN_START: {
      current.value = msg.current_player_id;
      wordHint.value = msg.word_hint;
      applyTimer(msg.timer.expires, msg.timer.start);
      state.value = 'in-turn';
      const player = findPlayer(msg.current_player_id)!;
      addChatMessage({
        kind: 'turn-start',
        player,
        me: player.id === me.value
      });
      break;
    }

    case MessageType.TURN_END: {
      endReason.value = msg.reason;
      wordHint.value = msg.word;
      applyScores(msg.scores);
      state.value = 'end-turn';
      applyTimer(msg.timer.expires, msg.timer.start);
      addChatMessage({
        kind: 'turn-end',
        word: msg.word
      });
      break;
    }

    case MessageType.GAME_END:
      state.value = 'end-game';
      addChatMessage({
        kind: 'game-end',
        winner: leaderboard.value[0][1],
        score: leaderboard.value[0][0]
      })
      break;

    case MessageType.DRAW:
      canvas.value?.importImage(msg.instructions);
      break;

    case MessageType.REVEAL_HINT:
      wordHint.value = msg.word_hint;
      break;

    case MessageType.STOP:
      state.value = 'none';
      break;

    case MessageType.ERROR:
      console.error('An error occurred:', ErrorCode[msg.code], msg.detail);
      break;

    default:
      unhandled(msg);
  }
};

function applyState(msg: LoginResponse) {
  applyTimer(msg.timer.expires, msg.timer.start);
  players.value.push(...msg.players);
  canSendChat.value = true;
  current.value = msg.current_player;
  me.value = msg.me;
  roomOwner.value = msg.owner;
  round.value = msg.round;
  wordHint.value = msg.word_hint;
  state.value = msg.state;
  canvas.value?.importImage(msg.draw_instructions);

  canvas.value
}

const messageScreen = ref<string>('loading');

let timeLeftInterval = -1;
const timerProgress = ref(0);
const timerProgressDanger = computed(() =>
  clamp((timerProgress.value - 0.75) * 4, 0, 1)
);
function applyTimer(expires: number, start: number) {
  clearInterval(timeLeftInterval);

  if (expires === -1 || start === -1) {
    timerProgress.value = 0;
    timeLeft.value = 0;
    return;
  }

  timeLeftInterval = setInterval(() => {
    const now = Date.now();
    const diff = expires - now;
    timeLeft.value = Math.max(Math.round(diff / 1000), 0);
    timerProgress.value = clamp((now - start) / (expires - start), 0, 1);
    if (timeLeft.value <= 0) {
      clearInterval(timeLeftInterval);
    }
  }, 100);
}

function applyScores(newScores: { player_id: number, points: number }[]) {
  newScores.forEach(s => {
    const player = findPlayer(s.player_id)!;
    player.newScore = s.points;
    player.score += s.points;
  })
}

function sendMessage(msg: ClientMessage) {
  const json = JSON.stringify(msg);
  websocket.send(json);
}

// const p: Player = {
//   id: -1,
//   name: 'Player',
//   score: 0,
//   has_guessed: false,
//   avatar: [],
//   avatar_bg: 2
// };
const chatMessages = ref<ChatItem[]>([
  // { kind: 'chat', player: p, me: true, content: 'hello', guessed: false },
  // { kind: 'chat', player: p, me: true, content: 'hello', guessed: true },
  // { kind: 'chat', player: p, me: false, content: 'hello', guessed: false },
  // { kind: 'chat', player: p, me: false, content: 'hello', guessed: true },
  // { kind: 'guess', player: p, me: true },
  // { kind: 'almost', word: 'a' },
  // { kind: 'turn-start', player: p, me: false },
  // { kind: 'turn-end', word: 'hello' },
  // { kind: 'game-end', winner: p, score: 400 },
  // { kind: 'kick', player: p, toKick: p, kicks: 2, required: 5 }
]);

function addChatMessage(msg: ChatItem) {
  chatMessages.value.push(msg);
}

const chatInput = ref('');
function sendChat() {
  chatScrolledToBottom.value = true;
  sendMessage({
    type: MessageType.SEND_CHAT,
    content: chatInput.value
  });
  chatInput.value = '';
}

function startGame() {
  const msg: StartGameMessage = { type: MessageType.START_GAME };
  sendMessage(msg);
}

function stopGame() {
  sendMessage({ type: MessageType.STOP });
}

const wordOptions = ref<string[]>([]);
function chooseWord(index: number) {
  const msg: WordChosenMessage = {
    type: MessageType.WORD_CHOSEN,
    word_index: index
  };
  sendMessage(msg);
}

const canvas = ref<InstanceType<typeof DrawCanvas>>();

function onDraw(inst: DrawInstruction) {
  if (websocket.readyState !== websocket.OPEN) return;
  if (me.value !== current.value && state.value === 'in-turn') return;

  const msg: DrawMessage = {
    type: MessageType.DRAW,
    instructions: [inst]
  };
  sendMessage(msg);
}

const chatContainer = ref<HTMLElement>();
const chatScrolledToBottom = ref(true);
function onChatScroll(e: Event) {
  if (chatContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = chatContainer.value;
    chatScrolledToBottom.value = scrollTop >= scrollHeight - clientHeight;
  }
}

function onAfterEnterChat(el: Element) {
  if (chatScrolledToBottom.value) {
    el.scrollIntoView();
  }
}

function onScrollToBottomClick() {
  chatScrolledToBottom.value = true;
  const elm = chatContainer.value?.querySelector<HTMLElement>(':scope > *:last-child') ?? undefined;
  elm?.scrollIntoView();
}

const settingsVisible = ref(false);
const gameSettings = ref(structuredClone(defaultSettings))

let canvasToolbox: HTMLElement | undefined;
let canvasWrapper: HTMLElement | undefined;
let gameAreaHeight = 0;

const canvasWidth = ref(0);
const canvasToolboxOffsetY = ref(0);

function resize({ height }: { height: number }) {
  gameAreaHeight = height;
  const drawCanvas = canvas.value?.$el;
  if (!(drawCanvas instanceof HTMLElement)) return;

  canvasToolbox ??= drawCanvas.querySelector<HTMLElement>('div.toolbox') ?? undefined;
  canvasWrapper ??= drawCanvas.querySelector<HTMLElement>('.canvas') ?? undefined;
  if (!canvasToolbox || !canvasWrapper) return;

  resizeToolbox();

  canvasWidth.value = Math.max((height) / 3 * 4, 250);
}

function resizeToolbox() {
  if (!canvasToolbox || !canvasWrapper) return;

  const space = gameAreaHeight - canvasWrapper.clientHeight;
  const offset = space;
  canvasToolboxOffsetY.value = clamp(offset, 0, canvasToolbox.clientHeight);
}

const drawCanvasModel = ref({
  tool: 'brush' as 'brush' | 'erase',
  lineWidth: 6,
  color: 1
});

</script>

<template>
  <main ref="root" class="page">
    <div class="info-bar">
      <div class="timer">{{ timeLeft }}s</div>
      <div class="word">{{ wordHint }}</div>
      <div class="timer-progress"></div>
    </div>
    <div class="player-list">
      <TransitionGroup name="list">
        <PlayerInfo v-for="player in players" :key="player.id" :player="player" :current="current === player.id"
          :host="roomOwner === player.id" :me="me === player.id" />
      </TransitionGroup>
    </div>

    <div v-if="me === roomOwner" class="owner-controls">
      <Button @click="startGame" :disabled="players.length < 2" label="Start game">
        <template #icon>
          <MaterialIcon icon="play_arrow" />
        </template>
      </Button>
      <Button @click="stopGame" label="Stop game" severity="secondary">
        <template #icon>
          <MaterialIcon icon="stop" />
        </template>
      </Button>
      <Button @click="settingsVisible = true" label="Settings" severity="secondary">
        <template #icon>
          <MaterialIcon icon="settings" />
        </template>
      </Button>
    </div>

    <div class="game-area" v-resize:0.immediate="resize">
      <div class="canvas-wrapper">
        <DrawCanvas ref="canvas" @draw="onDraw" :width="640" :height="480" :scale="2" :canDraw="true"
          :tools="drawCanvasModel">
          <template #after-canvas>
            <MessageContainer :selected="''">
              <template #waiting-for-host>
                <div class="title">
                  <span v-if="roomOwner === me">
                    <span v-if="players.length > 1">
                      Click 'Start game' to begin...
                      <Button label="Start" severity="transparent"></Button>
                    </span>
                    <span v-else>Waiting for more players…</span>
                  </span>
                  <span v-else>Waiting for host...</span>
                </div>
              </template>
              <template #loading>
                <div class="loading-msg">
                  <LoadingSpinner :size="48" :thickness="4" />
                  <div class="title">Loading</div>
                </div>
              </template>
              <template #final-leaderboard>
                <div class="title">Final results for this game.</div>
                <ol class="winner-list">
                  <li v-for="[pos, player] in leaderboard" :key="player.id" :value="pos">
                    <span>{{ player.name }}</span>: <span>{{ player.score }} pts.</span>
                  </li>
                </ol>
              </template>
              <template #round>
                Round {{ round }}
              </template>
              <template #leaderboard>
                <div class="leaderboard">
                  <div class="title">The word was {{ wordHint }}!</div>
                  <div class="reason">
                    <span v-if="endReason === 'guessed'">Everyone guessed the word!</span>
                    <span v-if="endReason === 'time-out'">Time ran out!</span>
                    <span v-if="endReason === 'kick'">The player was kicked!</span>
                    <span v-if="endReason === 'left'">The player left!</span>
                  </div>
                  <ol>
                    <li v-for="player in players" :key="player.id" :class="{ guessed: player.has_guessed }">
                      {{ player.name }}: {{ player.score }} pts.
                      <span v-if="player.newScore">(+{{ player.newScore }})</span>
                    </li>
                  </ol>
                </div>
              </template>
              <template #choose-word>
                <div class="word-chooser">
                  <div class="title">Choose a word:</div>
                  <div class="word-options">
                    <Button v-for="[i, word] in wordOptions.entries()" :key="word" @click="chooseWord(i)"
                      :label="wordOptions[i]" severity="transparent"></Button>
                  </div>
                </div>
              </template>
              <template #choosing-word>
                {{ currentPlayer?.name }} is choosing a word…
              </template>
            </MessageContainer>
            <DrawCanvasControls v-model="drawCanvasModel" @clear="canvas?.clear" v-resize:0.immediate="resizeToolbox" />
          </template>
        </DrawCanvas>
      </div>

    </div>

    <div class="chat-area">
      <article ref="chatContainer" @scroll="onChatScroll" class="chat-content">
        <TransitionGroup @enter="onAfterEnterChat" name="list">
          <section v-for="[i, msg] in chatMessages.entries()" :key="i">
            <ChatMessageComponent :msg="msg" />
          </section>
        </TransitionGroup>
      </article>
      <form class="chat-form" @submit.prevent="sendChat">
        <Transition name="shrink">
          <Button @click="onScrollToBottomClick" class="scroll-to-bottom-button backdrop-blur"
            v-if="!chatScrolledToBottom" severity="secondary" label="Scroll to bottom">
            <template #icon>
              <MaterialIcon icon="arrow_downward" />
            </template>
          </Button>
        </Transition>
        <InputText class="chat-input" @keydown.enter="sendChat" aria-label="Message" placeholder="Enter message…"
          v-model="chatInput" fluid />
        <Button class="send-button" type="submit" :disabled="!chatInput.length || !canSendChat"
          aria-label="Send message">
          <template #icon>
            <MaterialIcon icon="send" />
          </template>
        </Button>
      </form>
    </div>

    <Dialog class="settings-dialog" v-model:visible="settingsVisible" modal header="Settings">
      <Grid gap="1rem">
        <FloatLabel variant="in">
          <label for="rounds-per-game-input">Rounds per game</label>
          <InputNumber v-model="gameSettings.rounds_per_game" inputId="rounds-per-game-input" showButtons />
        </FloatLabel>
        <FloatLabel variant="in">
          <label for="choose-word-timer-input">"Choose word" timer</label>
          <InputNumber v-model="gameSettings.choose_word_timer" inputId="choose-word-timer-input" showButtons />
        </FloatLabel>
        <FloatLabel variant="in">
          <label for="timer-input">Turn duration</label>
          <InputNumber v-model="gameSettings.timer" inputId="timer-input" showButtons />
        </FloatLabel>
        <FloatLabel variant="in">
          <label for="max-hints-input">Maximum hints per turn</label>
          <InputNumber v-model="gameSettings.max_hints" inputId="max-hints-input" showButtons />
        </FloatLabel>
        <Button label="Save">
          <template #icon>
            <MaterialIcon icon="save" />
          </template>
        </Button>
      </Grid>
    </Dialog>
  </main>
</template>

<style scoped>
main {
  --player-list-width: clamp(16ch, 15vw, 25ch);
  --chat-width: clamp(22ch, 18vw, 30ch);
  --canvas-width: calc(1px * v-bind(canvasWidth));

  display: grid;
  grid-template-areas:
    "  .    info  .  "
    "player game chat"
    "owner  game chat";
  grid-template-columns:
    var(--player-list-width) min(var(--canvas-width), 100% - var(--chat-width) - var(--player-list-width) - 2rem) var(--chat-width);
  grid-template-rows: auto minmax(0, 1fr) auto;
  place-content: center;
  gap: 1rem;

  @media (width < 60rem) {
    grid-template-areas:
      "info   chat"
      "game   chat"
      "player chat"
      "player owner";
    grid-template-columns: 4fr 2fr;
    grid-template-rows: auto auto 1fr auto;
  }

  @media (width < 40rem) {
    grid-template-areas:
      "info  "
      "game  "
      "chat  "
      "player"
      "owner ";
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 16rem auto auto;
  }
}

.player-list {
  z-index: 10;
  grid-area: player;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: auto;

  /* Allows shadow to be visible with overflow: auto */
  padding: 0.25rem;
  margin: -0.25rem;
}

.settings-dialog {
  isolation: isolate;

  label {
    z-index: 1;
  }
}

.game-area {
  display: grid;
  grid-area: game;
  max-width: var(--canvas-width);
  position: relative;

  .canvas-wrapper {
    position: absolute;
    inset: 0;
    display: grid;

    > * {
      grid-area: 1/1/1/1;
    }
  }

  @media (width < 60rem) {
    max-width: 100%;

    .canvas-wrapper {
      position: static;
      width: 100%;

      > * {
        grid-area: 1/1/1/1;
      }
    }

    :deep(.toolbox) {
      translate: 0 0 !important;
    }

    :deep(.canvas) {
      margin-bottom: 0 !important;
    }
  }

  :deep(.toolbox) {
    translate: 0 calc(1px * v-bind(canvasToolboxOffsetY));
  }

  :deep(.canvas) {
    margin-bottom: calc(1px * v-bind(canvasToolboxOffsetY));
  }

  :deep(canvas) {
    filter: url(#blur-filter-2);
  }

  :deep(.message-backdrop) {
    background-color: rgb(0 0 0 / 0.33);
    backdrop-filter: var(--backdrop-blur);
  }

  .leaderboard {
    display: grid;
    gap: 0.5rem;
    place-items: center;

    .reason {
      color: rgb(255 255 255 / 0.75);
      font-size: 1.25rem;
    }

    .guessed {
      color: green;
    }
  }

  .loading-msg {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .word-chooser {
    display: grid;
    gap: 0.5rem;
    text-align: center;
    place-items: center;

    .word-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  }
}

.owner-controls {
  z-index: 10;
  grid-area: owner;
  display: grid;
  gap: 0.5rem;
}

.info-bar {
  z-index: 10;
  grid-area: info;
  display: grid;
  grid-template-areas:
    "timer    word        .    "
    "progress progress progress";
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  place-items: center;

  .timer {
    grid-area: timer;
    justify-self: start;
    padding: 0.5rem;
  }

  .word {
    grid-area: word;
    font-family: monospace;
    letter-spacing: 0.5ch;
    padding: 0.5rem;
  }

  .timer-progress {
    position: relative;
    grid-area: progress;
    background: light-dark(rgb(from black r g b / 0.10), rgb(from white r g b / 0.15));
    width: 100%;
    height: 0.25rem;
    border-radius: 1rem;

    &::after {
      --progress: calc(100% * v-bind(timerProgress));
      --danger: calc(100% * v-bind(timerProgressDanger));
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      width: var(--progress);
      background-color: color-mix(in lch, var(--p-button-danger-background) var(--danger, 100%), var(--p-primary-color));
    }
  }
}

.chat-area {
  z-index: 10;
  grid-area: chat;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 0.5rem;

  .chat-content {
    overflow-x: hidden;
    overflow-y: scroll;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    word-wrap: break-word;

    > * {
      flex: 0;
    }
  }

  .chat-form {
    position: relative;
    display: flex;
    gap: 0.5rem;

    .chat-input {
      flex: 1;
    }
  }

  .scroll-to-bottom-button {
    position: absolute;
    top: calc(-100% - 1rem);
    inset-inline: 0;
    width: max-content;
    margin: auto;
    z-index: 5;
  }
}

.message-container {
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}

.list-enter-from {
  opacity: 0;
  translate: 0 2rem;
}

.list-leave-to {
  opacity: 0;
  translate: -2rem;
}

.list-leave-active {
  position: absolute;
}

.shrink-enter-active,
.shrink-leave-active {
  transition: scale 0.25s ease;
}

.shrink-enter-from,
.shrink-leave-to {
  scale: 0;
}
</style>
