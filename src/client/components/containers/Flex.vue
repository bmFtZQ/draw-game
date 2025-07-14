<script setup lang="ts">
type FlexDirection = 'initial' | 'column' | 'row' | 'column-reverse'
  | 'row-reverse';

type JustifyContent = 'initial' | 'normal' | 'center' | 'start' | 'end'
  | 'space-between' | 'space-around' | 'space-evenly' | 'stretch' | 'left'
  | 'right';

type AlignContent = JustifyContent | 'baseline' | 'first baseline'
  | 'last baseline';

type AlignItems = AlignContent | 'safe center' | 'unsafe center'
  | 'anchor-center' | 'self-start' | 'self-end';

type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

withDefaults(defineProps<{
  direction?: FlexDirection,
  gap?: string,
  justify?: JustifyContent,
  alignContent?: AlignContent,
  alignItems?: AlignItems,
  wrap?: FlexWrap
}>(), {
  direction: 'row',
  gap: '0',
  justify: 'normal',
  alignContent: 'normal',
  alignItems: 'normal',
  wrap: 'nowrap'
});
</script>

<template>
  <div class="flex">
    <slot></slot>
  </div>
</template>

<style>
.flex {
  display: flex;
  flex-direction: v-bind(direction);
  justify-content: v-bind(justify);
  align-content: v-bind(alignContent);
  align-items: v-bind(alignItems);
  flex-wrap: v-bind(wrap);
  gap: v-bind(gap);
}
</style>
