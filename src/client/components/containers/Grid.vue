<script setup lang="ts">
import { computed } from 'vue';

type JustifyContent = 'initial' | 'normal' | 'center' | 'start' | 'end'
  | 'space-between' | 'space-around' | 'space-evenly' | 'stretch' | 'left'
  | 'right';

type JustifyItems = AlignItems;

type AlignContent = JustifyContent | 'baseline' | 'first baseline'
  | 'last baseline';

type AlignItems = AlignContent | 'safe center' | 'unsafe center'
  | 'anchor-center' | 'self-start' | 'self-end';

const props = withDefaults(defineProps<{
  columns?: string,
  rows?: string,
  areas?: string[],
  alignItems?: AlignItems,
  alignContent?: AlignContent,
  justifyItems?: JustifyItems,
  justifyContent?: JustifyContent,
  gap?: string,
}>(), {
  columns: '1fr',
  rows: 'initial',
  areas: () => [],
  alignItems: 'normal',
  alignContent: 'normal',
  justifyItems: 'normal',
  justifyContent: 'normal',
  gap: '0'
});

const areas = computed(() =>
  props.areas
    .map(e => `"${e}"`)
    .join(' ')
);
</script>

<template>
  <div class="grid">
    <slot></slot>
  </div>
</template>

<style>
.grid {
  display: grid;
  grid-template-columns: v-bind(columns);
  grid-template-rows: v-bind(rows);
  grid-template-areas: v-bind(areas);
  align-items: v-bind(alignItems);
  align-content: v-bind(alignContent);
  justify-items: v-bind(justifyItems);
  justify-content: v-bind(justifyContent);
  gap: v-bind(gap);
}
</style>
