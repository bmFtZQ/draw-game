<script setup lang="ts">
import { ref } from 'vue';

const response = ref('Click the button');

async function makeRequest() {
  response.value = 'loading...';
  response.value = await fetch('/message').then(r => r.text());
}
</script>

<template>
  <div class="about">
    <h1>This is an about page</h1>
    <button @click="makeRequest">Make request</button>
    <pre><code>{{ response }}</code></pre>
  </div>
</template>

<style scoped>
.about {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  gap: 1rem;
}

pre > code {
  display: block;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1rem;
}
</style>
