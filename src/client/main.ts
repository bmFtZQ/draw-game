import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';
import Resizer from 'v-resize-observer';
import preset from './PrimeVueTheme';

const app = createApp(App)


app.use(router)

app.use(PrimeVue, {
  theme: {
    preset,
    options: {
      cssLayer: true
    }
  }
});

app.use(Resizer);

app.mount('#app');

const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach(e => {
    const { width, height } = e.contentRect;
    const aspectRatio = width / height;
    document.documentElement.style.setProperty(
      '--viewport-aspect-ratio',
      aspectRatio.toString()
    );
  });
});

resizeObserver.observe(document.documentElement);
