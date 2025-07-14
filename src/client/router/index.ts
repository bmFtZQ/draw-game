import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/game/:room?',
      name: 'game',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/GameView.vue'),
      props: true,
    }
  ],
})

router.afterEach((to, from) => {
  const toDepth = split(to.path).length;
  const fromDepth = split(from.path).length;
  to.meta.transition = toDepth >= fromDepth ? 'page-forward' : 'page-backward';

  function split(n: string) {
    // filter used to remove last element if empty.
    return n.split('/').filter((v, i, a) => i < a.length - 1 || v);
  }
})

declare module 'vue-router' {
  interface RouteMeta {
    transition?: string;
  }
}

export default router
