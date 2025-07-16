<script setup lang="ts">
import { Button, Card, Popover, Select, SelectButton, SplitButton } from 'primevue';
import Grid from './containers/Grid.vue';
import Flex from './containers/Flex.vue';
import MaterialIcon from './MaterialIcon.vue';
import type { MenuItem } from 'primevue/menuitem';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { colorNames, colors } from '@/utils';
import PopoverButton from './PopoverButton.vue';

type Tools = 'brush' | 'erase';

const props = withDefaults(defineProps<{
  pointerdown?: boolean
}>(), {
  pointerdown: false
});

const model = defineModel<{
  tool: Tools,
  lineWidth: number,
  color: number
}>({ required: true });

const emit = defineEmits<{
  clear: []
}>();

// const inCanvasMode = ref(false);

// onMounted(() => {

// });

const icons: Record<Tools, { icon: string, label: string }> = {
  brush: { icon: 'brush', label: 'Brush' },
  erase: { icon: 'ink_eraser', label: 'Erase' }
}

const lineWidthOptions = [3, 6, 9, 15];

const colorOptions = range(26);

function onClearClick(e: MouseEvent) {
  emit('clear');
}

function range(length: number): number[] {
  return Array.from({ length }).map((_, i) => i);
}

watch(() => model.value.color, () => {
  if (model.value.tool === 'erase') {
    // Switch back to brush if user changes colour while eraser is selected.
    model.value.tool = 'brush';
  }
});
</script>

<template>
  <Card ref="root" class="toolbox backdrop-blur">
    <template #content>
      <Flex gap="1rem">
        <!-- color -->
        <PopoverButton v-model="model.color" :options="colorOptions" label="Colours">
          <template #button-content="slotProps">
            <div class="color" :style="{ '--_color': colors[slotProps.value] }"></div>
          </template>
          <template #popover="slotProps">
            <Grid gap="0rem" rows="repeat(2, 1fr)" autoFlow="column">
              <button class="invisible" autofocus v-for="opt in slotProps.options" @click="slotProps.setter(opt)">
                <div class="color" :style="{ '--_color': colors[opt] }" :aria-label="colorNames[opt]"></div>
              </button>
            </Grid>
          </template>
        </PopoverButton>

        <!-- lineWidth -->
        <Select :options="lineWidthOptions" v-model="model.lineWidth">
          <template #value="o">
            <div class="line-width" :style="{ '--_line-width': o.value }" aria-label="Thickness {{ o.option }}"></div>
          </template>
          <template #option="o">
            <div class="line-width" :style="{ '--_line-width': o.option }" aria-label="Thickness {{ o.option }}"></div>
          </template>
        </Select>

        <!-- tool -->
        <SelectButton v-model="model.tool" :allow-empty="false" :options="['brush', 'erase']" size="large">
          <template #option="o">
            <MaterialIcon :icon="icons[o.option as Tools].icon" :alt="icons[o.option as Tools].label" />
          </template>
        </SelectButton>

        <!-- clear button -->
        <Button size="large" @click="onClearClick" severity="secondary">
          <template #icon>
            <MaterialIcon icon="destruction" alt="Clear" />
          </template>
        </Button>
      </Flex>
    </template>
  </Card>
</template>

<style scoped>
.toolbox {
  position: absolute;
  inset-inline: 1rem;
  margin: auto;
  width: min-content;
  max-width: calc(100% - 2rem);
  bottom: 1rem;
  transition: translate 750ms cubic-bezier(.42, 1.53, .41, 1.01);

  /* & {
    translate: 0 6rem;
  } */
}

.line-width,
.color {
  display: inline-flex;
  vertical-align: middle;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    display: inline-block;
    aspect-ratio: 1;
  }
}

.line-width {
  height: 1.5rem;
  width: 1rem;

  &::before {
    width: 2px;
    scale: var(--_line-width);
    background-color: currentColor;
    border-radius: 50%;
  }
}

.color {
  &::before {
    width: 1.5rem;
    background-color: var(--_color);
  }
}

button.invisible {
  appearance: none;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;

  &:focus-visible {
    z-index: 1;
    outline: calc(var(--p-focus-ring-width) * 2) var(--p-focus-ring-style) var(--p-focus-ring-color);
    outline-offset: var(--p-focus-ring-offset);
    box-shadow: var(--p-focus-ring-shadow);
  }
}
</style>
