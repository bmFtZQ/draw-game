<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  selected?: string
}>();

</script>

<template>
  <div :class="{ 'message-container': true, 'empty': !selected }">

    <Transition name="fade">
      <div v-if="selected" class="message-backdrop"></div>
    </Transition>

    <div v-for="slot in Object.keys($slots)" class="message">
      <Transition name="slide">
        <div v-if="selected === slot" class="message-content">
          <slot :name="slot"></slot>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.message-container {
  position: relative;

  &.empty {
    pointer-events: none;
  }
}

.message-backdrop {
  position: absolute;
  inset: 0;
}

.message {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: auto;

  &:empty {
    display: none;
    pointer-events: none;
  }
}

.message-content {
  color: rgb(255 255 255);
  text-shadow: 0 1px 4px rgb(0 0 0 / 0.5);
  font-size: clamp(1rem, 2vw, 2rem);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active {
  transition:
    opacity 0.65s,
    translate 0.65s cubic-bezier(.42, 1.53, .41, 1.01);
}

.slide-leave-active {
  transition:
    opacity 0.25s,
    translate 0.65s cubic-bezier(.23, .84, .37, 1);
}

.slide-enter-from,
.slide-leave-to {
  translate: 0 -6rem;
  opacity: 0;
}

.slide-leave-to {
  translate: 0 6rem;
  opacity: 0;
}
</style>
