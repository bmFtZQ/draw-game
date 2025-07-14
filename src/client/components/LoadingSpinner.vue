<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    required: true,
    default: 16
  },
  thickness: {
    type: Number,
    default: 2
  },
  color: {
    type: String,
    default: 'currentColor'
  }
});

const thickness = computed(() => props.thickness * (16 / props.size));
const radius = computed(() => 8 - thickness.value / 2);
</script>

<template>
  <div class="wrapper">
    <svg :width="size" :height="size" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50%" cy="50%" :r="radius" />
    </svg>
  </div>
</template>

<style scoped>
.wrapper {
  width: calc(v-bind(size) * 1px);
  aspect-ratio: 1/1;
}
svg {
  display: block;
  margin: 0;
  transform-origin: center;
  animation: rotate-360 1.333s linear infinite normal;
}

circle {
  --circumference: calc(2px * 3.1415926536 * v-bind(radius));
  --max-gap: calc(var(--circumference) * .99);
  --min-gap: calc(var(--circumference) * .25);

  fill: none;
  stroke-dasharray: var(--circumference);
  stroke: v-bind(color);
  stroke-width: calc(1px * v-bind(thickness));
  stroke-linecap: round;
  transform-origin: center;
  animation: stroke-rotate calc(1.333s * 4) cubic-bezier(.35, 0, .25, 1) infinite both;
}

@keyframes rotate-360 {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(1turn);
  }
}

@keyframes stroke-rotate {
  0% {
    stroke-dashoffset: var(--max-gap);
  }

  12.5% {
    stroke-dashoffset: var(--min-gap);
    transform: rotate(0);
  }

  12.5001%,
  25% {
    transform: rotateX(180deg) rotate(90deg);
  }

  25% {
    stroke-dashoffset: var(--max-gap);
  }

  25.0001%,
  37.5% {
    transform: rotate(270deg);
  }

  37.5% {
    stroke-dashoffset: var(--min-gap);
  }

  37.5001%,
  50% {
    transform: rotateX(180deg) rotate(180deg);
  }

  50% {
    stroke-dashoffset: var(--max-gap);
  }

  50.0001%,
  62.5% {
    transform: rotate(180deg);
  }

  62.5% {
    stroke-dashoffset: var(--min-gap);
  }

  62.5001%,
  75% {
    transform: rotateX(180deg) rotate(270deg);
  }

  75% {
    stroke-dashoffset: var(--max-gap);
  }

  75.0001%,
  87.5% {
    transform: rotate(90deg);
  }

  87.5% {
    stroke-dashoffset: var(--min-gap);
  }

  87.5001%,
  100% {
    transform: rotateX(180deg) rotate(360deg);
  }

  100% {
    stroke-dashoffset: var(--max-gap);
  }
}
</style>
