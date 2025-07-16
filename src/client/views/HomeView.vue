<script setup lang="ts">
// import DrawingCanvas from '@/components/DrawingCanvas.vue';
import router from '@/router';
import { computed, onMounted, ref } from 'vue';
import type { DrawInstruction } from '../../shared/draw-v1';
import { localGet, localSet } from '@/utils';
import PlayerAvatarBg from '@/components/PlayerAvatarBg.vue';
import MaterialIcon from '@/components/MaterialIcon.vue';

import Button from 'primevue/button';
import { Card, Divider, FloatLabel, InputText } from 'primevue';
import Flex from '@/components/containers/Flex.vue';
import DrawCanvas from '@/components/DrawCanvas.vue';
import Grid from '@/components/containers/Grid.vue';
import DrawCanvasControls from '@/components/DrawCanvasControls.vue';

const roomId = ref('');

const canvas = ref<InstanceType<typeof DrawCanvas>>();

onMounted(() => {
  if (canvas.value) {
    const image = localGet<DrawInstruction[]>('avatar', []);
    canvas.value.importImage(image);
  }
})

function joinRoom() {

  avatar.value = canvas.value?.exportImage() ?? [];

  localSet('name', name.value);
  localSet('avatar', avatar.value);
  localSet('avatar_bg', avatar_bg.value);

  router.push({
    name: 'game',
    params: {
      room: roomId.value
    }
  });
}

const name = ref('');
const avatar = ref<DrawInstruction[]>([]);
const avatar_bg = ref<number>(0);

const drawCanvasModel = ref({
  tool: 'brush' as 'brush' | 'erase',
  lineWidth: 4,
  color: 1
});

onMounted(() => {
  name.value = localGet<string>('name', '');
  avatar.value = localGet<DrawInstruction[]>('avatar', []);
  avatar_bg.value = localGet<number>('avatar_bg', 2);
});

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}
</script>

<template>
  <main class="page">

    <Card>
      <template #content>
        <Flex class="split-container" gap="1rem">
          <Flex class="login" gap="1rem" direction="column" justify="center">
            <div class="text">
              <h1>Welcome</h1>
              <p>Enter your name below and draw your character.</p>
              <p>You can optionally enter a room ID to join, or leave it blank for
                a random public room.</p>
            </div>

            <FloatLabel variant="in">
              <InputText id="name-input" v-model="name" fluid />
              <label for="name-input">Name</label>
            </FloatLabel>

            <FloatLabel variant="in">
              <InputText id="room-id-input" v-model="roomId" fluid />
              <label for="room-id-input">Room ID</label>
            </FloatLabel>

            <Button @click="joinRoom" :disabled="!name" label="Join">
              <template #icon>
                <MaterialIcon icon="play_arrow" />
              </template>
            </Button>
          </Flex>

          <Divider layout="vertical" />

          <Grid class="character-creator" gap="0.5rem" columns="auto 1fr auto" alignItems="center"
            :areas="['prev canvas next', '. toolbox .']">
            <Button class="color-button prev" @click="avatar_bg = mod(avatar_bg - 1, 26)">
              <template #icon>
                <MaterialIcon icon="arrow_back" alt="Previous colour" />
              </template>
            </Button>

            <DrawCanvas ref="canvas" :height="64" :width="64" :scale="8" :transparent="true" :canDraw="true"
              :tools="drawCanvasModel">
              <template #before-canvas>
                <PlayerAvatarBg :fill="avatar_bg" height="100%" width="100%" />
              </template>
            </DrawCanvas>

            <Button class="color-button next" @click="avatar_bg = mod(avatar_bg + 1, 26)">
              <template #icon>
                <MaterialIcon icon="arrow_forward" alt="Next colour" />
              </template>
            </Button>

            <DrawCanvasControls v-model="drawCanvasModel" @clear="canvas?.clear" :lineWidthOptions="[2, 4, 6, 8]">
            </DrawCanvasControls>
          </Grid>
        </Flex>
      </template>
    </Card>
  </main>
</template>

<style scoped>
@media (width < 50rem) {
  .split-container {
    flex-direction: column;
  }
}

.page {
  display: grid;
  place-items: center;
}

.text {
  max-width: 40ch;
}

.player-avatar {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.toolbox {
  position: static;
  grid-area: toolbox;
  width: auto;
  max-width: none;
}
</style>
