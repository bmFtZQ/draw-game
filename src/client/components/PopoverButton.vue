<script setup lang="ts" generic="T">
import { Popover, type TabMenuChangeEvent } from 'primevue';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  options?: T[],
  label: string,
  disabled?: boolean
}>(), {
  options: (): T[] => [],
  disabled: false
});

const classes = ref({
  'p-select': true,
  'p-component': true,
  'p-inputwrapper': true,
  'p-input-wrapper-filled': true,
  'p-select-open': false,
  'p-inputwrapper-focus': false,
  'p-focus': false,
  'p-disabled': false,
});

watch(() => props.disabled, (value) => {
  classes.value['p-disabled'] = value;
}, { immediate: true });

defineSlots<{
  'button-content': (scope: { value: T }) => void,
  popover: (scope: { options: T[], setter: (value: T) => void }) => void
}>();

const root = ref<HTMLDivElement>();

const model = defineModel<T>({ required: true });

const popover = ref<InstanceType<typeof Popover>>();

const popoverOpen = ref(false);

watch(popoverOpen, (value) => {
  classes.value['p-select-open'] = value;
});

const focused = ref(false);

watch(focused, (value) => {
  classes.value['p-inputwrapper-focus'] = value;
  classes.value['p-focus'] = value;
});

function onButtonClick(e: MouseEvent) {
  popover.value?.toggle(e);
}

function setModel(value: T) {
  model.value = value;
  popover.value?.hide();
  root.value?.focus();
}
</script>

<template>
  <div ref="root" :class="classes" data-p data-pc-name="select" pc35 data-pc-section="root" @click="onButtonClick"
    :disabled="disabled || undefined" :data-p-disabled="disabled || undefined" @focusin="focused = true"
    @focusout="focused = false" tabindex="0">

    <span class="p-select-label" role="combobox" :aria-label="label" aria-haspopup="listbox" aria-expanded="false"
      aria-controls="pv_id_35_list" aria-disabled="false" data-p="" data-pc-section="label">
      <slot name="button-content" :value="model"></slot>
    </span>


    <div class="p-select-dropdown" data-pc-section="dropdown">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"
        class="p-icon p-select-dropdown-icon" aria-hidden="true" data-p="" data-pc-section="dropdownicon">
        <path
          d="M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z"
          fill="currentColor" />
      </svg>
    </div>
  </div>

  <Popover ref="popover" @show="popoverOpen = true" @hide="popoverOpen = false" :aria-label="label">
    <slot name="popover" :options="options" :setter="setModel"></slot>
  </Popover>
</template>

<style scoped></style>
