<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { DrawType, type CurveDrawInstruction, type DrawInstruction, type LineToDrawInstruction, type MoveDrawInstruction } from '../../shared/draw-v1';
import { colors, unhandled } from '@/utils';

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
    case DrawType.MOVE: move(instruction); break;
    case DrawType.DRAW_LINE: line(instruction); break;
    case DrawType.QUADRATIC_CURVE: curve(instruction); break;
    default: unhandled(instruction);
  }
}

function applyAppearance({ color, width }: { color: number, width: number }) {
  if (!ctx) return;

  ctx.lineWidth = width * scale.value;
  ctx.fillStyle = colors[color];
  ctx.strokeStyle = colors[color];
  ctx.lineCap = 'round';

  ctx.globalCompositeOperation = color === -1
    ? 'destination-out'
    : 'source-over';
}

function clear() {
  ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

let previous = { x: 0, y: 0 };

function move(instruction: MoveDrawInstruction) {
  const { x, y } = instruction;
  previous = { x, y };
}

function line(instruction: LineToDrawInstruction) {
  if (!ctx) return;

  const { x: px, y: py } = previous;
  const { x, y, width } = instruction;
  applyAppearance(instruction);

  console.log(width);

  if (x === px && y === py) {
    const path = new Path2D();
    path.arc(
      x * scale.value, y * scale.value,
      ctx.lineWidth / 2,
      0, Math.PI * 2
    );
    ctx.fill(path);
  }
  else {
    const path = new Path2D();
    path.moveTo(px * scale.value, py * scale.value);
    path.lineTo(x * scale.value, y * scale.value);
    ctx.stroke(path);
    previous = { x, y };
  }
}

function curve(instruction: CurveDrawInstruction) {
  if (!ctx) return;

  const { x: px, y: py } = previous;
  const { cx, cy, x, y } = instruction;
  applyAppearance(instruction);

  const path = new Path2D();
  path.moveTo(px * scale.value, py * scale.value);
  path.quadraticCurveTo(
    cx * scale.value,
    cy * scale.value,
    x * scale.value,
    y * scale.value
  );
  ctx.stroke(path);
  previous = { x, y };
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
