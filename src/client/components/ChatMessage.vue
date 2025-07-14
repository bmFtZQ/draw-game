<script setup lang="ts">
import type { Player } from '../../shared/draw-v1';

type MessageKind = 'chat' | 'guess' | 'almost' | 'turn-start' | 'turn-end'
  | 'join' | 'left' | 'game-end' | 'kick';

export type ChatItem = ChatMessageItem
  | GuessItem
  | AlmostItem
  | TurnStartItem
  | TurnEndItem
  | GameEndItem
  | PlayerJoinItem
  | PlayerLeftItem
  | PlayerKickItem
  | HostChangeItem;

interface ChatMessageItem {
  kind: 'chat';
  player: Player;
  content: string;
  me: boolean;
  guessed: boolean;
}

interface GuessItem {
  kind: 'guess';
  player: Player;
  me: boolean;
}

interface AlmostItem {
  kind: 'almost';
  word: string;
}

interface TurnStartItem {
  kind: 'turn-start';
  player: Player;
  me: boolean;
}

interface TurnEndItem {
  kind: 'turn-end';
  word: string;
}

interface GameEndItem {
  kind: 'game-end';
  winner: Player;
  score: number;
}

interface PlayerJoinItem {
  kind: 'join';
  player: Player;
}

interface PlayerLeftItem {
  kind: 'left';
  player: Player;
}

interface PlayerKickItem {
  kind: 'kick';
  player: Player;
  toKick: Player;
  kicks: number;
  required: number;
}

interface HostChangeItem {
  kind: 'host-change',
  player: Player;
  me: boolean;
}

defineProps<{
  msg: ChatItem
}>();
</script>

<template>
  <div v-if="msg.kind === 'chat'" :class="{
    chat: true,
    guessed: msg.guessed,
    me: msg.me
  }">
    <span :class="{ 'player': true }">{{ msg.player.name }}</span>
    <span class="content">{{ msg.content }}</span>
  </div>
  <div v-else-if="msg.kind === 'almost'" class="almost">
    '{{ msg.word }}' is close!
  </div>
  <div v-else-if="msg.kind === 'guess'" class="guessed">
    {{ msg.player.name }} guessed the word!
  </div>
  <div v-else-if="msg.kind === 'turn-start'" class="event turn-start">
    {{ msg.player.name }} is drawing now!
  </div>
  <div v-else-if="msg.kind === 'turn-end'" class="event turn-end">
    The word was '{{ msg.word }}'
  </div>
  <div v-else-if="msg.kind === 'game-end'" class="event game-end">
    {{ msg.winner.name }} won with a score of {{ msg.score }}!
  </div>
  <div v-else-if="msg.kind === 'join'" class="join">
    {{ msg.player.name }} joined the game.
  </div>
  <div v-else-if="msg.kind === 'left'" class="left">
    {{ msg.player.name }} left the game.
  </div>
  <div v-else-if="msg.kind === 'kick'" class="kick">
    {{ msg.player.name }} voting to kick {{ msg.toKick.name }} ({{ msg.kicks }}/{{ msg.required }})
  </div>
  <div v-else-if="msg.kind === 'host-change'" class="host-change">
    <span v-if="msg.me">You are now the host.</span>
    <span v-else>{{ msg.player.name }} is now the host.</span>
  </div>
</template>

<style scoped>
.event {
  font-weight: bold;
  color: var(--chat-event);
}

.turn-end {
  color: var(--chat-turn-end);
}

.game-end {
  color: var(--chat-game-end);
}

.almost {
  color: var(--chat-almost);
}

.guessed {
  color: var(--chat-player-color-guessed);
  font-weight: bold;
}

.join {
  color: var(--chat-player-joined);
  font-style: italic;
}

.left {
  color: var(--chat-player-left);
  font-style: italic;
}

.kick {
  font-style: italic;
  color: var(--chat-kick);
}

.host-change {
  font-style: italic;
  color: var(--chat-host-change);
}

.player {
  font-weight: bold;
  border-radius: 0.25rem;
  color: var(--_color);
  background-color: var(--_background);
  margin-inline-end: 0.5rem;

  + .content {
    color: var(--_content, rgb(from currentColor r g b / 0.75));
  }
}

.chat {
  &.guessed {
    --_color: var(--chat-player-color-guessed);
    --_background: var(--chat-player-background-guessed);
    --_content: var(--chat-player-content-guessed);
  }

  &.me {
    --_color: var(--chat-player-color-me);
    --_background: var(--chat-player-background-me);

    .player {
      padding: 0.125rem 0.25rem;
    }
  }
}
</style>
