import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './services/steamApi.js'
import './assets/main.css'

if (typeof localStorage !== 'undefined' && localStorage.getItem('steam_app_theme') === 'light') {
  document.body.classList.add('light-theme')
}

const app = createApp(App)
app.use(router)
app.mount('#app')
