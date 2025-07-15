<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { DrawType, type DrawInstruction, type DrawLineInstruction, type EraseLineInstruction } from '../../shared/draw-v1';
import { colors } from '@/utils';

const props = defineProps<{
  width: number,
  height: number,
  scale?: number,
  drawing?: DrawInstruction[]
}>();

const aspectRatio = computed(() => props.width / props.height);

const canvas = ref<HTMLCanvasElement>(null!);
let ctx: CanvasRenderingContext2D | undefined;

onMounted(() => {
  ctx = canvas.value.getContext('2d') ?? undefined;
  clear();

  watch(() => props.drawing, (value) => {
    if (value) {
      clear();
      drawImage(value);
    }
    else {
      clear();
    }
  }, { immediate: true });
});

const scale = computed(() => props.scale ?? 1);

function drawImage(image: DrawInstruction[]) {
  image.forEach(drawInstruction);
}

function drawInstruction(instruction: DrawInstruction) {
  switch (instruction.type) {
    case DrawType.CLEAR: clear(); break;
    case DrawType.DRAW_LINE: line(instruction); break;
    case DrawType.ERASE_LINE: erase(instruction); break;
  }
}

function clear() {
  ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function erase(instruction: EraseLineInstruction) {
  if (!ctx) return;

  ctx.lineWidth = instruction.width * scale.value;
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'destination-out';
  const path = new Path2D();
  path.moveTo(instruction.from_x * scale.value, instruction.from_y * scale.value);
  path.lineTo(instruction.to_x * scale.value, instruction.to_y * scale.value);
  ctx.stroke(path);
  ctx.globalCompositeOperation = 'source-over';
}

function line(instruction: DrawLineInstruction) {
  if (!ctx) return;
  ctx.lineWidth = instruction.width * scale.value;
  ctx.strokeStyle = colors[instruction.color];
  ctx.lineCap = 'round';

  if (instruction.color === -1) {
    ctx.globalCompositeOperation = 'destination-out';
  }

  const path = new Path2D();
  path.moveTo(instruction.from_x * scale.value, instruction.from_y * scale.value);
  path.lineTo(instruction.to_x * scale.value, instruction.to_y * scale.value);
  ctx.stroke(path);
  ctx.globalCompositeOperation = 'source-over';
}

defineExpose({ clear, drawImage, drawInstruction, canvas, ctx });

</script>

<template>
  <div class="canvas">
    <slot name="before-canvas"></slot>
    <canvas ref="canvas" :width="width * scale" :height="height * scale"></canvas>
    <slot name="after-canvas"></slot>
  </div>
</template>

<style scoped>
.canvas {
  position: relative;
  max-height: 100%;
  max-width: 100%;
  aspect-ratio: v-bind(aspectRatio);
  container: canvas size;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
