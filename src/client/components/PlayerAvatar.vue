<script lang="ts" setup>
import { computed } from 'vue';
import type { DrawInstruction } from '../../shared/draw-v1';
import DrawingCanvas from './DrawingCanvas.vue';
import PlayerAvatarBg from './PlayerAvatarBg.vue';

const props = defineProps<{
  fill?: number,
  stroke?: number,
  drawing?: DrawInstruction[],
  width?: number,
  height?: number
}>();

const height = computed(() => props.height ?? 48);
const width = computed(() => props.width ?? 48);
</script>

<template>
  <PlayerAvatarBg :height="height" :width="width" :fill="fill" :stroke="stroke">
    <DrawingCanvas :canDraw="false" :height="64" :width="64" :drawing="drawing" :transparent="true" />
  </PlayerAvatarBg>
</template>
