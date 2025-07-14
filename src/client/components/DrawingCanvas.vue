<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { DrawType, type DrawClearInstruction, type DrawInstruction, type DrawLineInstruction, type EraseLineInstruction } from '../../shared/draw-v1';
import { getColor } from '@/utils';
import { Button, Card } from 'primevue';

const props = defineProps<{
  canDraw: boolean,
  width: number,
  height: number,
  scale?: number,
  drawing?: DrawInstruction[],
  transparent?: boolean
}>();

const scale = computed(() => props.scale ?? 1);

const emit = defineEmits<{
  draw: [DrawInstruction]
}>();

const canvas = ref<HTMLCanvasElement>(null!);
let ctx: CanvasRenderingContext2D = null!;
const image = ref<DrawInstruction[]>([]);

const color = ref(1);
const lineWidth = ref(6);
const tool = ref<'brush' | 'erase'>('brush');

function drawImage(insts: DrawInstruction[]) {
  for (const inst of insts) {
    drawInstruction(inst);
  }
}

function exportImage(): DrawInstruction[] {
  return [...image.value];
}

function drawInstruction(inst: DrawInstruction) {
  switch (inst.type) {
    case DrawType.CLEAR: clear(); break;
    case DrawType.DRAW_LINE: line(inst); break;
    case DrawType.ERASE_LINE: erase(inst); break;
  }
}

function emitInstruction(inst: DrawInstruction) {
  if (inst.type === DrawType.CLEAR) {
    image.value.length = 0;
  }
  else {
    image.value.push(inst);
  }
  emit('draw', inst);
}

function clearCanvas() {
  clear();
  emitInstruction({ type: DrawType.CLEAR });
}

function clear() {
  ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function erase(inst: EraseLineInstruction) {
  ctx.lineWidth = inst.width;
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'destination-out';
  const path = new Path2D();
  path.moveTo(inst.from_x * scale.value, inst.from_y * scale.value);
  path.lineTo(inst.to_x * scale.value, inst.to_y * scale.value);
  ctx.stroke(path);
  ctx.globalCompositeOperation = 'source-over';
}

function line(inst: DrawLineInstruction) {
  ctx.lineWidth = inst.width * scale.value;
  ctx.strokeStyle = getColor(inst.color);
  ctx.lineCap = 'round';

  if (inst.color === -1) {
    ctx.globalCompositeOperation = 'destination-out';
  }

  const path = new Path2D();
  path.moveTo(inst.from_x * scale.value, inst.from_y * scale.value);
  path.lineTo(inst.to_x * scale.value, inst.to_y * scale.value);
  ctx.stroke(path);
  ctx.globalCompositeOperation = 'source-over';
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')!;
  clear();

  watch(() => props.drawing, (value) => {
    if (value) {
      image.value = [...value];
      clear();
      drawImage(image.value);
    }
    else {
      clear();
    }
  }, { immediate: true });
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
})

const prevEvent = ref({ clientX: 0, clientY: 0 });
const mouseDown = ref(false);

function translateMouse(x: number, y: number): { x: number, y: number } {
  const rect = canvas.value.getBoundingClientRect();
  const wr = props.width / rect.width;
  const hr = props.height / rect.height;

  return {
    x: (x - rect.x) * wr,
    y: (y - rect.y) * hr
  };
}

function onPointerDown(e: PointerEvent) {
  mouseDown.value = true;
  const mouse = translateMouse(e.clientX, e.clientY);
  prevEvent.value = { clientX: mouse.x, clientY: mouse.y };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onPointerUp(e: PointerEvent) {
  mouseDown.value = false;
  window.removeEventListener('pointermove', onPointerMove);
  const mouse = translateMouse(e.clientX, e.clientY);
  const { clientX: prevX, clientY: prevY } = prevEvent.value;

  if (prevX === mouse.x && prevY === mouse.y) {
    const li: DrawLineInstruction | EraseLineInstruction = {
      type: tool.value === 'erase' ? DrawType.ERASE_LINE : DrawType.DRAW_LINE,
      color: color.value,
      from_x: mouse.x,
      from_y: mouse.y,
      to_x: mouse.x,
      to_y: mouse.y,
      width: lineWidth.value * e.pressure * 2
    };
    if (li.type === DrawType.ERASE_LINE) { erase(li); }
    else { line(li); }
    emitInstruction(li);
  }
}

function onPointerMove(e: PointerEvent) {
  if (!mouseDown.value) return;
  const { clientX: prevX, clientY: prevY } = prevEvent.value;
  const mouse = translateMouse(e.clientX, e.clientY);

  const li: DrawLineInstruction | EraseLineInstruction = {
    type: tool.value === 'erase' ? DrawType.ERASE_LINE : DrawType.DRAW_LINE,
    color: color.value,
    from_x: prevX,
    from_y: prevY,
    to_x: mouse.x,
    to_y: mouse.y,
    width: lineWidth.value * e.pressure * 2
  };

  if (li.type === DrawType.ERASE_LINE) { erase(li); }
  else { line(li); }
  emitInstruction(li);

  prevEvent.value = { clientX: mouse.x, clientY: mouse.y };
}

defineExpose({ clear, drawImage, exportImage, drawInstruction, canvas, ctx });

function range(i: number): number[] {
  return Array.from({ length: i }, (_, i) => i);
}

watch(() => props.canDraw, () => {
  classes.value['can-draw'] = props.canDraw;
});

watch(() => props.transparent, () => {
  classes.value.transparent = props.transparent;
});

const classes = ref({
  'drawing-canvas': true,
  transparent: props.transparent,
  'can-draw': props.canDraw,
  // 'can-draw': true,
  small: false,
  medium: false
});

// const canDraw = computed(() => true);

function calcSize({ width, height }: { width: number, height: number }) {
  classes.value.small = width < 300;
  classes.value.medium = width < 600;
}

</script>

<template>
  <div :class="classes">
    <div class="drawing-container">
      <div class="canvas-wrapper">
        <canvas ref="canvas" :width="width * scale" :height="height * scale"
          v-on="{ pointerdown: canDraw && onPointerDown }"></canvas>
        <slot name="canvas"></slot>
      </div>
      <div v-if="canDraw" class="toolbox">
        <Card class="widths">
          <template #content>
            <div class="palette ">
              <input v-for="i in [3, 6, 12]" class="width" type="radio" v-model="lineWidth" :value="i"
                :style="{ '--width': i / 3 }">
            </div>
          </template>
        </Card>
        <Card class="colors">
          <template #content>
            <div class="palette ">
              <input v-for="i in range(16)" class="color" type="radio" v-model="color" :value="i"
                :style="{ '--color': getColor(i) }">
            </div>
          </template>
        </Card>
        <Card class="tools">
          <template #content>
            <div class="palette ">
              <input type="radio" v-model="tool" value="brush" aria-label="Brush">
              <input type="radio" v-model="tool" value="erase" aria-label="Eraser">
              <Button @click="clearCanvas" label="Clear" severity="secondary"></Button>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawing-container {
  width: 100%;
  height: 100%;
}

.canvas-wrapper {
  width: 100%;

  position: relative;
}

canvas {
  background: white;
  display: block;
  width: 100%;
  border-radius: 0.5rem;
}

.drawing-canvas {
  &.transparent {
    canvas {
      background: transparent;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
  }
}

.drawing-container {
  display: grid;
  gap: 1rem;
  grid-template-rows: minmax(0, 1fr);
  align-items: start;

  .can-draw & {
    grid-template-rows: auto minmax(0, 1fr);
  }
}

.toolbox {
  display: grid;
  grid-template-areas: "widths colors tools";
  gap: 1rem;

  .drawing-canvas.medium & {
    grid-template-areas:
      "colors colors"
      "widths tools";
  }

  .drawing-canvas.small {
    grid-template-areas:
      "colors"
      "widths"
      "tools";
  }

  input[type="radio"] {
    position: relative;
    appearance: none;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
    min-height: 2rem;
    min-width: 2rem;

    &:checked::after {
      content: '';
      position: absolute;
      inset: 0;
      margin: auto;
      background: white;
      width: 1rem;
      aspect-ratio: 1/1;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
    }
  }

  .palette {
    /* padding: 1rem; */
    /* background-color: rgb(200 200 200 / 0.5); */
    /* border-radius: 0.5rem; */
    display: grid;
    gap: 0.5rem;
  }

  .widths {
    grid-area: widths;

    .palette {
      grid-template-rows: repeat(3, minmax(0, 1fr));
    }

    .drawing-canvas.medium {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: minmax(0, 1fr);
    }

    .width {
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-color: currentColor;
        border-radius: inherit;
        --offset: 2%;
        --low: calc(50% - 3% * var(--width));
        --high: calc(50% + 3% * var(--width));
        mask-image: linear-gradient(-45deg,
            transparent calc(var(--low) - var(--offset)),
            black var(--low), black var(--high),
            transparent calc(var(--high) + var(--offset)));
      }
    }
  }

  .colors {
    grid-area: colors;
    .palette {
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }

    .color {
      position: relative;
      appearance: none;
      background-color: var(--color);
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.5);

      &:checked::after {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        background: white;
        width: 1rem;
        aspect-ratio: 1/1;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
      }
    }
  }

  .tools {
    grid-area: tools;
    /* grid-template-columns: repeat(2, minmax(0, 1fr)); */
  }
}
</style>
