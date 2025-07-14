<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  icon: string,
  alt?: string,
  size?: number
}>();

const iconSize = computed(() => `${props.size ?? 24}px`);

</script>

<template>
  <span class="icon material-symbols-outlined" :aria-label="alt">
    <span class="inner" aria-hidden="true">{{ icon }}</span>
  </span>
</template>

<style scoped>
.icon {
  font-size: v-bind(iconSize);
}

.inner {
  display: block;
}
</style>
