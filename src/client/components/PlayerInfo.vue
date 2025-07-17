<script setup lang="ts">
import { Card } from 'primevue';
import type { Player } from '../../shared/draw-v1';
import PlayerAvatar from './PlayerAvatar.vue';
import MaterialIcon from './MaterialIcon.vue';

defineProps<{
  player: Player,
  current: boolean,
  host: boolean,
  me: boolean,
}>();
</script>

<template>
  <Card :data-current="current" :data-guessed="player.has_guessed" :data-me="me">
    <template #content>
      <div class="playerinfo-grid">
        <div class="avatar">
          <PlayerAvatar :fill="player.avatar_bg" :drawing="player.avatar" />
          <div class="badges">
            <MaterialIcon :size="20" v-if="host" class="badge host" icon="settings" />
          </div>
        </div>
        <div class="player-name">
          {{ player.name }}
        </div>
        <div class="player-score">{{ player.score }} pts.</div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.p-card {
  --p-card-body-padding: 0.75rem 1rem;
  --_gradient-color: transparent;
  background-image: linear-gradient(to right, var(--_gradient-color), transparent);
}

[data-me="true"] {
  --_text-color: var(--player-me-text-color) !important;
  --_gradient-color: var(--player-me-background-tint);
}

[data-current="true"] {
  --_gradient-color: var(--player-current-background-tint);
}

[data-guessed="true"] {
  --_gradient-color: var(--player-guessed-background-tint);
  --_pts-color: var(--player-guessed-text-color);
}

.playerinfo-grid {
  display: grid;
  column-gap: 0.5rem;
  align-items: center;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "avatar name"
    "avatar score";
}

.avatar {
  grid-area: avatar;
  width: 48px;
  position: relative;
}

.badges {
  --_badge-size: 24px;
  position: absolute;
  left: calc(var(--_badge-size) / -3);
  bottom: calc(var(--_badge-size) / -3);

  .badge {
    display: block;
    border-radius: 0.25rem;

    background-color: var(--_badge-color);
    color: rgb(255 255 255 / 0.85);

    &.host {
      --_badge-color: grey;
    }
  }
}

.player-name {
  grid-area: name;
  color: var(--_text-color, inherit);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.player-score {
  grid-area: score;
  color: var(--_pts-color);
}
</style>
