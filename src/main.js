import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import locale from 'element-plus/dist/locale/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import InfiniteScroll from 'vue-infinite-scroll'
import * as IconName from 'vue-icons-plus/tfi'
const app = createApp(App)

app.use(router)
app.use(ElementPlus, { locale })
if (!app._context.directives.InfiniteScroll) {
  app.use(InfiniteScroll);
}

window.global = window;

// 注册所有图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

for (const [key, component] of Object.entries(IconName)) {
  app.component(key, component)
}

app.mount('#app')

