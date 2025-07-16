<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
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

function emitInstruction(instruction: DrawInstruction) {
  if (instruction.type === DrawType.CLEAR) {
    image.value.length = 0;
  }
  else {
    image.value.push(instruction);
  }
  emit('draw', instruction);
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

const pointerInCanvas = ref(false);
const mouseX = ref(0);
const mouseY = ref(0);
const canvasWidth = ref(0);
const cursorSize = computed(() =>
  (lineWidth.value * props.scale * (canvasWidth.value / props.width) )/ 2
);
const cursorVisible = computed(() => pointerInCanvas.value && props.canDraw);

function onPointerMove(e: PointerEvent) {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;

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

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove);
});

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});

function canvasResize({ width }: { width: number }) {
  canvasWidth.value = width;
}

</script>

<template>
  <Grid :class="{ 'draw-canvas': true, transparent }" :data-in-canvas="pointerInCanvas || undefined">
    <Canvas ref="canvas" :width="width" :height="height" :scale="scale">
      <template #before-canvas>
        <slot name="before-canvas"></slot>
      </template>
      <template #after-canvas>
        <div class="click-catcher" @pointerdown.prevent.self="onPointerDown" @pointerenter="pointerInCanvas = true"
          @pointerleave="pointerInCanvas = false" v-resize="canvasResize"></div>
        <slot name="after-canvas"></slot>
      </template>
    </Canvas>
    <div class="mouse-cursor" :data-in-canvas="pointerInCanvas || undefined"></div>
  </Grid>
</template>

<style scoped>
.draw-canvas {
  user-select: none;

  &[data-in-canvas] .click-catcher {
    cursor: none;
  }

  &:not(.transparent) :deep(canvas) {
    background: white;
    border-radius: 0.5rem;
  }
}

.click-catcher {
  position: absolute;
  inset: 0;
}

.mouse-cursor {
  display: none;
  position: fixed;
  top: v-bind('mouseY + "px"');
  left: v-bind('mouseX + "px"');
  translate: -50% -50%;
  width: v-bind('cursorSize + "px"');
  aspect-ratio: 1;
  border-radius: 50%;
  pointer-events: none;
  border: 1px solid black;
  outline: 1px solid white;

  &[data-in-canvas] {
    display: block;
  }
}

@media not (hover: hover) {
  .mouse-cursor {
    display: none;
  }
}
</style>
