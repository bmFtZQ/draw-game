/**
 * All messages that will be sent between clients and the server.
 */
export type Message = ClientMessage | ServerMessage;

/**
 * Messages that a client can send to the server.
 */
export type ClientMessage = LoginRequest
  | StartGameMessage
  | StopMessage
  | WordChosenMessage
  | SendChatMessage
  | DrawMessage;

/**
 * Messages that the server will send to a client.
 */
export type ServerMessage = ErrorMessage
  | LoginResponse
  | PlayerJoinMessage
  | PlayerLeaveMessage
  | NewRoundMessage
  | ChooseWordMessage
  | TurnStartMessage
  | TurnEndMessage
  | GameEndMessage
  | StopMessage
  | RevealHintMessage
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

/**
 * Sent to a client when an error occurs, typically in response to a bad
 * request.
 */
export interface ErrorMessage {
  type: MessageType.ERROR;
  code: ErrorCode,
  detail?: any
}

/**
 * Sent to server from client to join a room
 */
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

/**
 * Broadcast to all clients when a new game is starting.
 */
export interface StartGameMessage {
  type: MessageType.START_GAME;
}

/**
 * Broadcast to all clients when a player joins the room.
 */
export interface PlayerJoinMessage {
  type: MessageType.PLAYER_JOIN;
  id: number;
  name: string;
  avatar_bg: number;
  avatar: DrawInstruction[];
}

/**
 * Broadcast to all clients when a player leaves the room.
 */
export interface PlayerLeaveMessage {
  type: MessageType.PLAYER_LEAVE;
  reason: 'left' | 'kick';
  id: number;
}

/**
 * Broadcast to all clients when a new round has started.
 */
export interface NewRoundMessage {
  type: MessageType.NEW_ROUND;
  round: number;
  timer: TimerUpdate;
}

/**
 * Broadcast before a new turn begins, the current player will receive a list of
 * possible words in {@link words} that they can choose using
 * {@link WordChosenMessage}.
 */
export interface ChooseWordMessage {
  type: MessageType.CHOOSE_WORD;
  current_player_id: number;
  words?: string[];
  timer: TimerUpdate;
}

/**
 * Sent to the server to indicate that the current player had chosen their word.
 */
export interface WordChosenMessage {
  type: MessageType.WORD_CHOSEN;
  word_index: number;
}

/**
 * Broadcast when a new turn begins, current player will receive a complete
 * {@link word_hint}, while others will receive a hidden word with underscores.
 */
export interface TurnStartMessage {
  type: MessageType.TURN_START;
  current_player_id: number;
  word_hint: string;
  timer: TimerUpdate;
}

/**
 * Broadcast to players other than the current when a hint for the current word
 * has been revealed.
 */
export interface RevealHintMessage {
  type: MessageType.REVEAL_HINT;
  word_hint: string;
}

/**
 * The current turn had ended, and a summary of scores should be displayed.
 */
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

/**
 * Broadcast to all clients that the current game had completed and the
 * leaderboard should be shown.
 */
export interface GameEndMessage {
  type: MessageType.GAME_END,
  scores: {
    player_id: number;
    points: number;
  }[];
}

/**
 * Can be sent to server from host client to immediately stop the current game,
 * message will then be forwarded to all clients.
 */
export interface StopMessage {
  type: MessageType.STOP
}

/**
 * Send a chat message or guess to the server.
 */
export interface SendChatMessage {
  type: MessageType.SEND_CHAT;
  content: string;
}

/**
 * Incoming chat message from the server, to be printed in message list.
 */
export interface ChatMessage {
  type: MessageType.CHAT;
  player_id: number;
  content: string;
}

/**
 * Let a player know their guess was close to the actual word.
 */
export interface AlmostGuessMessage {
  type: MessageType.ALMOST;
  word: string;
}

/**
 * Broadcast when a player guesses a word correctly.
 */
export interface PlayerGuessedMessage {
  type: MessageType.PLAYER_GUESSED;
  player_id: number;
  word?: string;
}

/**
 * Broadcast when the host of the room changes, e.g. previous host left.
 */
export interface OwnerChangeMessage {
  type: MessageType.OWNER_CHANGE;
  player_id: number;
}

export enum DrawType {
  TOOLS_CHANGE,
  CLEAR,
  MOVE,
  DRAW_LINE,
  QUADRATIC_CURVE
}

export interface DrawMessage {
  type: MessageType.DRAW;
  instructions: DrawInstruction[];
}

export type DrawInstruction = ClearDrawInstruction
  | MoveDrawInstruction
  | LineToDrawInstruction
  | CurveDrawInstruction;

export interface ClearDrawInstruction {
  type: DrawType.CLEAR;
}

export interface MoveDrawInstruction {
  type: DrawType.MOVE;
  x: number;
  y: number;
}

export interface LineToDrawInstruction {
  type: DrawType.DRAW_LINE;
  x: number;
  y: number;
  width: number;
  color: number;
}

export interface CurveDrawInstruction {
  type: DrawType.QUADRATIC_CURVE;
  cx: number;
  cy: number;
  x: number;
  y: number;
  width: number;
  color: number;
}

// export interface FillDrawInstruction {
//   type: 'fill';
//   x: number;
//   y: number;
//   color: number;
// }
