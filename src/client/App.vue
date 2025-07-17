<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import Button from 'primevue/button';

const blurStrength = ref(150);
const drawingFilterChannels = ref(['R', 'G', 'B', 'A']);

setInterval(() => {
  requestAnimationFrame(() => {
    drawingFilterChannels.value = drawingFilterChannels.value
      .map((v, i, a) => a[(i + 1) % a.length]);
  });
}, 250);

function beforePageEnter(el: Element) {
  if (el instanceof HTMLElement) {
    el.style.setProperty('--_in-transition-height', el.clientHeight + 'px');
  }
}

function beforePageLeave(el: Element) {
  if (el instanceof HTMLElement) {
    el.style.setProperty('--_in-transition-height', el.clientHeight + 'px');
  }
}
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="24" height="24" />
    <div class="title">Draw</div>

    <nav>
      <RouterLink to="/">
        <Button severity="secondary" variant="text">Home</Button>
      </RouterLink>
    </nav>
  </header>

  <div class="page-wrapper">
    <RouterView v-slot="{ Component, route }">
      <Transition :name="route.meta.transition" @enter="beforePageEnter" @leave="beforePageLeave">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>

  <svg class="visually-hide">
    <defs>
      <filter id="blur-filter-2" x="-1" y="-1" height="3" width="3">
        <feGaussianBlur :stdDeviation="blurStrength" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="blur-filter" x="-1" y="-1" height="3" width="3">
        <feColorMatrix type="luminanceToAlpha" />
        <feComponentTransfer result="result-luminance">
          <feFuncA type="linear" slope="10" />
        </feComponentTransfer>
        <feComposite in="SourceGraphic" operator="in" in2="result-luminance" />
        <feGaussianBlur :stdDeviation="blurStrength" result="result-blur" />
        <feMerge>
          <feMergeNode in="result-blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="paper-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" seed="0" stitchTiles="noStitch"
          result="feTurbulence-9c1f3d74" />
        <feDiffuseLighting in="feTurbulence-9c1f3d74" surfaceScale="2" diffuseConstant="1" lighting-color="#ffffff"
          result="feDiffuseLighting-0924e9c2">
          <feDistantLight azimuth="45" elevation="75" />
        </feDiffuseLighting>
        <feBlend in="feDiffuseLighting-0924e9c2" in2="SourceGraphic" mode="multiply"></feBlend>
        <feComposite in="feBlend-59ffcabd" in2="SourceAlpha" operator="in"></feComposite>
      </filter>

      <filter id="drawing-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="1" />
        <feDisplacementMap in="SourceGraphic" scale="5" :xChannelSelector="drawingFilterChannels[0]"
          :yChannelSelector="drawingFilterChannels[1]" />
      </filter>
    </defs>
  </svg>
</template>

<style scoped>
.visually-hide {
  visibility: hidden;
  position: absolute;
}

header {
  flex: 0;
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 2rem;
  margin: auto;
  width: 100%;
  max-width: var(--app-max-width);
}

.title {
  font-weight: bold;
  font-size: 1.25rem;
  margin-top: -1px;
}

.logo {
  display: block;
}

.page-wrapper {
  flex: 1;
  width: 100%;
  margin-inline: auto;
  max-width: var(--app-max-width);
  position: relative;
  display: flex;

  > * {
    flex: 1;
  }
}

.page-forward-leave-active,
.page-forward-enter-active,
.page-backward-leave-active,
.page-backward-enter-active {
  --_duration: 500ms;
  --_grow-factor: .25;

  position: absolute;
  inset: 0 0 auto;
  height: max(var(--_in-transition-height), 100%);

  transition-duration: var(--_duration);
  transition-property: scale, opacity;
}

.page-forward-enter-active,
.page-backward-enter-active {
  transition-timing-function:
    cubic-bezier(.25, 1, .25, 1),
    cubic-bezier(.5, 0, .75, .75)
}

.page-forward-leave-active,
.page-backward-leave-active {
  transition-timing-function:
    cubic-bezier(.25, 1, .25, 1),
    cubic-bezier(0, .5, .75, .75);

}

.page-forward-enter-from,
.page-backward-leave-to {
  scale: calc(1 / (var(--_grow-factor) + 1));
  opacity: 0;
}

.page-forward-leave-to,
.page-backward-enter-from {
  scale: calc(var(--_grow-factor) + 1);
  opacity: 0;
}
</style>
