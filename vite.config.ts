/// <reference types="vite-ssg" />
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { readFile } from 'node:fs/promises'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// 产物级冒烟守护：vite-ssg 与 unhead 大版本不匹配时，SSG head 会「静默失效」——
// 构建照常成功、产物却缺 title。对预渲染产物直接断言，失效即构建红。
async function assertPrerenderedHead() {
  const html = await readFile('dist/index.html', 'utf8')
  for (const expected of ['<title>', 'Nothing here', 'noindex']) {
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
    onFinished: assertPrerenderedHead,
  },
  test: {
    environment: 'jsdom',
  },
})
