import { ViteSSG } from 'vite-ssg'

// 字体自托管（Fontsource，只引入实际用到的字重）：
// 面向含中国大陆在内的全球用户，不外链 Google Fonts（见全局规范 global-reachability.md）
import '@fontsource/fredoka/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'

import './styles/theme.css'
import './styles/base.css'

import { createAppI18n } from '@/locales'

import App from './App.vue'
import LandingView from './views/LandingView.vue'

// 兜底站：任意路径（含 /）都渲染同一页——用户在错误子域下访问什么路径都一样；
// 预渲染路径由 vite.config 的 includedRoutes 显式指定为 ['/']（默认过滤逻辑会排除
// 带 `:`/`*` 的 catch-all 路由，故需覆盖），与本处路由定义相互配合。
const routes = [{ path: '/:pathMatch(.*)*', name: 'landing', component: LandingView }]

export const createApp = ViteSSG(App, { routes, base: import.meta.env.BASE_URL }, ({ app }) => {
  const i18n = createAppI18n()
  app.use(i18n)
  // 语言判定放在页面组件的 onMounted 里做（而非此处 setup 回调），
  // 保证水合首帧与预渲染英文 HTML 保持一致，避免整页 hydration mismatch
})
