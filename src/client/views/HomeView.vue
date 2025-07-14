<script setup lang="ts">
import DrawingCanvas from '@/components/DrawingCanvas.vue';
import router from '@/router';
import { computed, onMounted, ref } from 'vue';
import type { DrawInstruction } from '../../shared/draw-v1';
import { getColor, localGet, localSet } from '@/utils';
import PlayerAvatarBg from '@/components/PlayerAvatarBg.vue';
import MaterialIcon from '@/components/MaterialIcon.vue';

import Button from 'primevue/button';
import { Card, Divider, FloatLabel, InputText } from 'primevue';
import Flex from '@/components/containers/Flex.vue';

const roomId = ref('');

const canvas = ref<InstanceType<typeof DrawingCanvas>>();

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
      <template #title>asdf</template>
      <template #content>
        <div class="split-container">
          <Flex class="login" gap="1rem" direction="column">
            <FloatLabel variant="in">
              <InputText id="room-id-input" v-model="roomId" fluid />
              <label for="room-id-input">Room ID</label>
            </FloatLabel>

            <FloatLabel variant="in">
              <InputText id="name-input" v-model="name" fluid />
              <label for="name-input">Name</label>
            </FloatLabel>

            <Button @click="joinRoom" :disabled="!name" label="Join">
              <template #icon>
                <MaterialIcon icon="play_arrow" />
              </template>
            </Button>
          </Flex>

          <Divider layout="vertical" />

          <div class="character-creator">

            <DrawingCanvas ref="canvas" :height="64" :width="64" :scale="4" :transparent="true" :canDraw="true"
              :drawing="avatar">
              <template #canvas>
                <Button class="color-button prev" @click="avatar_bg = mod(avatar_bg - 1, 16)">
                  <template #icon>
                    <MaterialIcon icon="arrow_back" alt="Previous colour" />
                  </template>
                </Button>
                <Button class="color-button next" @click="avatar_bg = mod(avatar_bg + 1, 16)">
                  <template #icon>
                    <MaterialIcon icon="arrow_forward" alt="Next colour" />
                  </template>
                </Button>
                <PlayerAvatarBg :fill="avatar_bg" height="100%" width="100%" />
              </template>
            </DrawingCanvas>
          </div>
        </div>
      </template>
    </Card>



  </main>
</template>

<style scoped>
.page {
  display: grid;
  place-items: center;
}

.split-container {
  display: flex;
  gap: 1rem;
}

.drawing-canvas {
  width: 22rem;
  margin-inline: calc(var(--p-button-icon-only-width) + 1rem);
  isolation: isolate;

  .color-button {
    position: absolute;
    width: var(--p-button-icon-only-width);
    height: auto;
    top: 50%;
    translate: var(--_offset-x, 0) -50%;

    &.prev {
      --_offset-x: calc(-100% - 1rem);
      left: 0;
    }

    &.next {
      --_offset-x: calc(100% + 1rem);
      right: 0;
    }
  }
}

:deep(.canvas-wrapper) {
  display: grid;

  > * {
    grid-area: 1/1/1/1;
    width: 100%;
    height: 100%;
  }

  > :deep(.player-avatar) {
    z-index: -1;
  }
}
</style>
