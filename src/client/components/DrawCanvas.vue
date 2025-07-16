<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { DrawType, type ClearDrawInstruction, type DrawInstruction, type LineToDrawInstruction, type MoveDrawInstruction } from '../../shared/draw-v1';
import Canvas from './Canvas.vue';
import Grid from './containers/Grid.vue';

const props = withDefaults(defineProps<{
  width: number,
  height: number,
  scale?: number,
  transparent?: boolean,
  canDraw?: boolean,
  tools?: {
    tool: 'brush' | 'erase',
    lineWidth: number,
    color: number
  }
}>(), {
  scale: 1,
  transparent: false,
  canDraw: true
});

const emit = defineEmits<{
  draw: [DrawInstruction]
}>();

const canvas = ref<InstanceType<typeof Canvas>>();

const image = ref<DrawInstruction[]>([]);
function importImage(img: DrawInstruction[]) {
  image.value = [...img];
  canvas.value?.drawImage(image.value);
}

function drawInstruction(instruction: DrawInstruction) {
  canvas.value?.drawInstruction(instruction);
}

function clear() {
  const inst: ClearDrawInstruction = { type: DrawType.CLEAR };
  emitInstruction(inst);
  canvas.value?.clear();
}

defineExpose({ importImage, clear, canvas });

let previous = { x: 0, y: 0, pressure: 0 };
const mouseDown = ref(false);

function translateMouse(x: number, y: number): { x: number, y: number } {
  const rect = canvas.value!.canvas.getBoundingClientRect();
  const wr = props.width / rect.width;
  const hr = props.height / rect.height;

  return {
    x: (x - rect.x) * wr,
    y: (y - rect.y) * hr
  };
}

function onPointerDown(e: PointerEvent) {
  if (!props.canDraw) return;
  mouseDown.value = true;
  const { x, y } = translateMouse(e.clientX, e.clientY);

  const instruction: MoveDrawInstruction = { type: DrawType.MOVE, x, y };
  drawInstruction(instruction);
  emitInstruction(instruction);
  previous = { x, y, pressure: e.pressure };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onPointerUp(e: PointerEvent) {
  mouseDown.value = false;
  window.removeEventListener('pointermove', onPointerMove);

  const { x, y } = translateMouse(e.clientX, e.clientY);
  const { x: px, y: py, pressure } = previous;

  if (x === px && y === py) {
    const instruction: LineToDrawInstruction = {
      type: DrawType.DRAW_LINE,
      color: tool.value === 'brush' ? color.value : -1,
      x, y,
      width: lineWidth.value * pressure * 2
    }
    drawInstruction(instruction);
    emitInstruction(instruction);
  }
}

function onPointerMove(e: PointerEvent) {
  if (!mouseDown.value) return;
  const { x, y } = translateMouse(e.clientX, e.clientY);

  const instruction: LineToDrawInstruction = {
    type: DrawType.DRAW_LINE,
    color: tool.value === 'brush' ? color.value : -1,
    x, y,
    width: lineWidth.value * e.pressure * 2
  };

  canvas.value?.drawInstruction(instruction);
  emitInstruction(instruction);
  previous = { x, y, pressure: e.pressure };
}

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});

function emitInstruction(instruction: DrawInstruction) {
  if (instruction.type === DrawType.CLEAR) {
    image.value.length = 0;
  }
  else {
    image.value.push(instruction);
  }
  emit('draw', instruction);
}

const tool = ref<'brush' | 'erase'>('brush');
const lineWidth = ref(3);
const color = ref(0);

watch(() => props.tools, (value) => {
  if (value) {
    tool.value = value.tool;
    lineWidth.value = value.lineWidth;
    color.value = value.color;
  }
}, { immediate: true, deep: true });

</script>

<template>
  <Grid :class="{ 'draw-canvas': true, transparent }">
    <Canvas ref="canvas" :width="width" :height="height" :scale="scale">
      <template #before-canvas>
        <slot name="before-canvas"></slot>
      </template>
      <template #after-canvas>
        <div class="click-catcher" @pointerdown.self="onPointerDown"></div>
        <slot name="after-canvas"></slot>
      </template>
    </Canvas>
  </Grid>
</template>

<style scoped>
.draw-canvas {
  &:not(.transparent) :deep(canvas) {
    background: white;
    border-radius: 0.5rem;
  }
}

.click-catcher {
  position: absolute;
  inset: 0;
}
</style>
