export type Message = LoginRequest
  | ErrorMessage
  | LoginResponse
  | StartGameMessage
  | PlayerJoinMessage
  | PlayerLeaveMessage
  | NewRoundMessage
  | ChooseWordMessage
  | WordChosenMessage
  | TurnStartMessage
  | TurnEndMessage
  | GameEndMessage
  | StopMessage
  | RevealHintMessage
  | SendChatMessage
  | ChatMessage
  | PlayerGuessedMessage
  | AlmostGuessMessage
  | OwnerChangeMessage
  | DrawMessage;

export interface Player {
  id: number;
  name: string;
  score: number;
  has_guessed: boolean;
  avatar_bg: number;
  avatar: DrawInstruction[];
}

export interface GameSettings {
  timer: number;
  choose_word_timer: number;
  max_hints: number;
  rounds_per_game: number;
}

export const defaultSettings: GameSettings = {
  timer: 300,
  choose_word_timer: 10,
  max_hints: 5,
  rounds_per_game: 3
};

export enum MessageType {
  ERROR = -1,
  LOGIN_REQUEST,
  LOGIN_RESPONSE,
  START_GAME,
  PLAYER_JOIN,
  PLAYER_LEAVE,
  NEW_ROUND,
  CHOOSE_WORD,
  WORD_CHOSEN,
  TURN_START,
  REVEAL_HINT,
  TURN_END,
  GAME_END,
  STOP,
  SEND_CHAT,
  ALMOST,
  PLAYER_GUESSED,
  CHAT,
  OWNER_CHANGE,
  DRAW
}

export enum ErrorCode {
  UNKNOWN_MESSAGE,
  INVALID_MESSAGE,
  NOT_ENOUGH_PLAYERS,
  NOT_PERMITTED
}

export interface TimerUpdate {
  start: number;
  expires: number;
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  code: ErrorCode,
  detail?: any
}

// Initial request from client to server asking to join a room.
export interface LoginRequest {
  type: MessageType.LOGIN_REQUEST;
  room_id?: string;
  name: string;
  avatar: DrawInstruction[],
  avatar_bg: number;
}

export type GameState = 'none' | 'new-round' | 'choosing-word' | 'in-turn' | 'end-turn' | 'end-game';

// If previous request successful, return info about the room.
export interface LoginResponse {
  type: MessageType.LOGIN_RESPONSE;
  settings: GameSettings;
  room_id: string;
  players: {
    id: number;
    name: string;
    score: number;
    has_guessed: boolean;
    avatar_bg: number;
    avatar: DrawInstruction[];
  }[];
  me: number,
  owner: number,
  state: GameState;
  current_player: number;
  round: number;
  timer: TimerUpdate;
  word_hint: string;
  draw_instructions: DrawInstruction[];
}

export interface StartGameMessage {
  type: MessageType.START_GAME;
}

// Notify when a new player joins.
export interface PlayerJoinMessage {
  type: MessageType.PLAYER_JOIN;
  id: number;
  name: string;
  avatar_bg: number;
  avatar: DrawInstruction[];
}

// Notify when a player leaves.
export interface PlayerLeaveMessage {
  type: MessageType.PLAYER_LEAVE;
  reason: 'left' | 'kick';
  id: number;
}

// Notify a new round starting.
export interface NewRoundMessage {
  type: MessageType.NEW_ROUND;
  round: number;
  timer: TimerUpdate;
}

// Server sends request for current player to choose a word.
export interface ChooseWordMessage {
  type: MessageType.CHOOSE_WORD;
  current_player_id: number;
  words?: string[];
  timer: TimerUpdate;
}

// Player sends their chosen word back and the round begins.
export interface WordChosenMessage {
  type: MessageType.WORD_CHOSEN;
  word_index: number;
}

// Round has started, current player can get full word as hint.
export interface TurnStartMessage {
  type: MessageType.TURN_START;
  current_player_id: number;
  word_hint: string;
  timer: TimerUpdate;
}

export interface RevealHintMessage {
  type: MessageType.REVEAL_HINT;
  word_hint: string;
}

// Round has ended, display scores.
export interface TurnEndMessage {
  type: MessageType.TURN_END;
  reason: 'time-out' | 'guessed' | 'kick' | 'left';
  word: string;
  scores: {
    player_id: number;
    points: number;
  }[];
  timer: TimerUpdate;
}

export interface GameEndMessage {
  type: MessageType.GAME_END,
  scores: {
    player_id: number;
    points: number;
  }[];
}

export interface StopMessage {
  type: MessageType.STOP
}

// Send a chat message/guess to server.
export interface SendChatMessage {
  type: MessageType.SEND_CHAT;
  content: string;
}

// Chat message from the server.
export interface ChatMessage {
  type: MessageType.CHAT;
  player_id: number;
  content: string;
}

export interface AlmostGuessMessage {
  type: MessageType.ALMOST;
  word: string;
}

export interface PlayerGuessedMessage {
  type: MessageType.PLAYER_GUESSED;
  player_id: number;
  word?: string;
}

export interface OwnerChangeMessage {
  type: MessageType.OWNER_CHANGE;
  player_id: number;
}

export enum DrawType {
  CLEAR,
  DRAW_LINE,
  ERASE_LINE,
}

export interface DrawMessage {
  type: MessageType.DRAW;
  instructions: DrawInstruction[];
}

export type DrawInstruction = DrawLineInstruction
  | EraseLineInstruction
  | DrawClearInstruction;


export interface DrawClearInstruction {
  type: DrawType.CLEAR;
}

interface LineInstruction {
  from_x: number;
  from_y: number;
  to_x: number;
  to_y: number;
  width: number;
}

export interface DrawLineInstruction extends LineInstruction {
  type: DrawType.DRAW_LINE;
  color: number;
}

export interface EraseLineInstruction extends LineInstruction {
  type: DrawType.ERASE_LINE;
}

// export interface DrawFillInstruction {
//   type: 'fill';
//   x: number;
//   y: number;
//   color: number;
// }
