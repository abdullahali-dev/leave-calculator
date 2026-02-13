import { createApp } from 'vue'
import App from './App.vue'
// Use Bootstrap RTL stylesheet for proper RTL layout
import 'bootstrap/dist/css/bootstrap.rtl.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
// Global styles for dark mode
import './global.css'

createApp(App).mount('#app')
