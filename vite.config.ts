/// <reference types="vite-ssg" />
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { readFile } from 'node:fs/promises'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// 产物级冒烟守护：vite-ssg 与 unhead 大版本不匹配时，SSG head 会「静默失效」；
// 或 includedRoutes 配置不当导致 body 从未被预渲染——两种情况构建都照常成功。
// 对预渲染产物的 head 与 body 直接断言，失效即构建红。
async function assertPrerenderedHead() {
  const html = await readFile('dist/index.html', 'utf8')
  for (const expected of [
    '<title>',
    'Nothing here',
    'noindex',
    'data-server-rendered="true"', // body 确有被 vite-ssg 预渲染，而非空壳 <div id="app">
    'Take me to mintpop.ai', // 落地文案确实渲染进了产物
  ]) {
    if (!html.includes(expected)) {
      throw new Error(`SSG 冒烟断言失败：dist/index.html 缺少 ${expected}`)
    }
  }
  console.log('SSG head smoke check passed')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // nginx 的 error_page 指向 /index.html，根路由产物需在 dist 根
    dirStyle: 'nested',
    // 唯一路由是兜底用的 `/:pathMatch(.*)*`：vite-ssg 默认 includedRoutes 会过滤掉
    // 含 `:`/`*` 的路径，导致该路由被排除、routesPaths 为空、body 从未被预渲染
    // （dist/index.html 会停留在纯客户端 shell，<div id="app"> 空壳，只是 head 冒烟检查
    // 不查 body 而被掩盖）。这里显式只渲染根路径，覆盖默认过滤。
    includedRoutes: () => ['/'],
    onFinished: assertPrerenderedHead,
  },
  test: {
    environment: 'jsdom',
  },
})
