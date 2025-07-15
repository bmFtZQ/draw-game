<script lang="ts" setup>
import { colors } from '@/utils';
import { computed, ref } from 'vue';

const props = defineProps<{
  fill?: number,
  stroke?: number,
  width?: number | string,
  height?: number | string
}>();

const height = computed(() => props.height ?? 48);
const width = computed(() => props.width ?? 48);

const fillVal = computed(() => {
  return colors[props.fill ?? 2];
});

const strokeVal = computed(() => {
  return colors[props.stroke ?? 1];
});

function getSize(a: number | string): string {
  return typeof a === 'number' ? a + 'px' : a;
}
</script>

<template>
  <div class="player-avatar" :style="{ width: getSize(width), height: getSize(height) }">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path class="fill"
        d="M2.453 46.51c3.137 1.248 6.972-.024 12.541.04 3.066.034 6.554-.326 8.96-.174 2.306.146 6.717.589 9.37.408 4.939-.337 8.227.228 11.688-.163l-2.957-4.68-6.801-4.77-10.95-2.39-9.984 1.923-7.828 4.752z" />
      <path class="stroke" d="M3 45.125a29.698 34.57 0 0 1 42 0" />
      <circle class="fill" cx="24.125" cy="21.667" r="18.482" />
      <circle class="stroke" cx="24" cy="21.5" r="18.5" />
    </svg>
    <slot></slot>
  </div>
</template>

<style>
.player-avatar > * {
  grid-area: 1/1/1/1;
}
</style>

<style scoped>
.player-avatar {
  display: grid;
}

svg {
  display: block;
  height: 100%;
  width: 100%;
}

.fill {
  fill: v-bind(fillVal);
}

.stroke {
  fill: none;
  stroke: v-bind(strokeVal);
  stroke-width: 3px;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
