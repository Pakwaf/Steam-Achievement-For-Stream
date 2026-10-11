import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './services/steamApi.js'
import './assets/main.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
