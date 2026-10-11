import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import DesktopOverlay from '../views/DesktopOverlay.vue'
import ObsOverlay from '../views/ObsOverlay.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: 'Tableau de bord - Steam Custom Achievements' }
  },
  {
    path: '/overlay',
    name: 'DesktopOverlay',
    component: DesktopOverlay,
    meta: { transparent: true, title: 'Desktop Overlay' }
  },
  {
    path: '/obs',
    name: 'ObsOverlay',
    component: ObsOverlay,
    meta: { transparent: true, title: 'OBS Browser Overlay' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Gestion du titre de la page et de la transparence du body
router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
  if (to.meta?.transparent) {
    document.body.classList.add('transparent-view')
  } else {
    document.body.classList.remove('transparent-view')
  }
})

export default router
