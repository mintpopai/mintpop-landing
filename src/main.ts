import { ViteSSG } from 'vite-ssg'

// 字体自托管（Fontsource，只引入实际用到的字重）：
// 面向含中国大陆在内的全球用户，不外链 Google Fonts（见全局规范 global-reachability.md）
import '@fontsource/fredoka/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'

import './styles/theme.css'
import './styles/base.css'

import { detectLocale, STORAGE_KEY_LOCALE } from '@/config/locale'
import { createAppI18n } from '@/locales'
import { safeStorageGet } from '@/utils/safeStorage'

import App from './App.vue'
import LandingView from './views/LandingView.vue'

// 兜底站：任意路径（含 /）都渲染同一页——用户在错误子域下访问什么路径都一样
const routes = [{ path: '/:pathMatch(.*)*', name: 'landing', component: LandingView }]

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  ({ app, isClient }) => {
    const i18n = createAppI18n()
    app.use(i18n)
    // SSG 只预渲染英文；客户端 hydration 时按「记忆 > 浏览器语言 > 英文」切换
    if (isClient) {
      i18n.global.locale.value = detectLocale(
        safeStorageGet(STORAGE_KEY_LOCALE),
        navigator.language,
      )
    }
  },
)
