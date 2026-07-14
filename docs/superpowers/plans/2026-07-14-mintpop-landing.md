# MintPop Landing（未配置子域名兜底页）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建一个单屏品牌兜底页站点：所有未配置的 `*.mintpop.ai` 子域路由到它，全站返回 404 状态码并把用户导流回主站。

**Architecture:** Vue 3 + vite-ssg 预渲染单页（catch-all 路由），中英双语运行时判定（不走 URL 前缀），nginx 以 `error_page 404` 语义托管；Docker/CI/发版全套照抄 mintpop-website 模式。

**Tech Stack:** Vue 3 · vite-ssg · vue-i18n · @unhead/vue · TypeScript · pnpm · mise · nginx · GitHub Actions · GHCR

**Spec:** `docs/superpowers/specs/2026-07-14-mintpop-landing-design.md`

## Global Constraints

- 所有注释、文档、commit message 一律**简体中文**；代码/命令/标识符保持英文。
- 工具链版本锁根 `mise.toml`：`node = "24.16.0"`、`pnpm = "11.9.0"`（对齐主站）；命令一律走 `mise run <task>`。
- `package.json` 的 `scripts` 块**不新增任何与 mise task 重复的脚本**（保持无 scripts）。
- 字体只走 Fontsource 自托管（`@fontsource/fredoka` 600、`@fontsource/inter` 400/500/600），**禁止任何第三方外链资源**。
- 品牌资产从 `../mintpop-standards/docs/public/assets/brand/` 原样拷贝，不重绘不改动。
- 枚举成员名 SCREAMING_SNAKE_CASE（`Locale.EN/ZH`，取值 `'en'/'zh'` 为 BCP-47 技术符号例外）。
- 页面路径 HTTP 状态码一律 404（含根路径）；静态资源（`/assets/`、`/brand/`、`robots.txt`）为 200。
- 全站 `noindex, nofollow`（响应头 + meta + robots.txt 三重）。
- 参照文件的真相源：兄弟仓 `/Users/yuebai/workspace/mintpop-website`（下文写作 `../mintpop-website`）。
- 每个任务结束都要 `git commit`（conventional commits，中文描述）。

---

### Task 1: 项目脚手架与静态资产

**Files:**

- Create: `mise.toml`、`package.json`、`pnpm-workspace.yaml`、`.prettierrc.json`、`.prettierignore`、`tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json`、`tsconfig.vitest.json`、`eslint.config.ts`、`env.d.ts`、`vite.config.ts`、`index.html`、`public/robots.txt`、`public/brand/*`（拷贝）
- Modify: `.gitignore`

**Interfaces:**

- Produces: 可用的构建/测试工具链（`mise run install/run/build/lint/test/format/typecheck` 全部可跑）；`@` 别名指向 `src/`；vite-ssg 构建产物 `dist/`（nested dirStyle）；构建结束的 SSG head 冒烟断言（要求 `dist/index.html` 含 `<title>` 与 `Nothing here` 与 `noindex`——Task 4 的页面必须满足它）。

- [ ] **Step 1: 从主站原样拷贝可复用配置**

```bash
cd /Users/yuebai/workspace/mintpop-landing
cp ../mintpop-website/.prettierrc.json ../mintpop-website/tsconfig.json ../mintpop-website/tsconfig.app.json ../mintpop-website/tsconfig.node.json ../mintpop-website/tsconfig.vitest.json ../mintpop-website/eslint.config.ts ../mintpop-website/env.d.ts ../mintpop-website/pnpm-workspace.yaml .
```

- [ ] **Step 2: 写 `.prettierignore`**

```
dist
pnpm-lock.yaml
```

- [ ] **Step 3: 补 `.gitignore`**（已有 `.idea/`、`.claude/` 两行，追加）：

```
node_modules/
dist/
*.log
.DS_Store
```

- [ ] **Step 4: 写 `mise.toml`**——先拷贝主站再改两处：

```bash
cp ../mintpop-website/mise.toml .
```

改动 1（image task 的镜像名）：把

```toml
run = "docker build -t mintpop-website:local ."
```

改为

```toml
run = "docker build -t mintpop-landing:local ."
```

改动 2（build 任务保持不变，确认为 `pnpm vue-tsc -b && pnpm vite-ssg build`）。其余 task（install/run/preview/typecheck/lint/test/format/up/down/release）逐字保留。

- [ ] **Step 5: 写 `package.json`**（无 scripts 块；字体依赖下一步用 pnpm add 装，避免手猜版本号）：

```json
{
  "name": "mintpop-landing",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@unhead/vue": "^2.1.2",
    "vue": "^3.5.13",
    "vue-i18n": "^11.4.6",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@tsconfig/node24": "^24.0.4",
    "@types/node": "^24.13.2",
    "@vitejs/plugin-vue": "^6.0.7",
    "@vue/eslint-config-prettier": "^10.2.0",
    "@vue/eslint-config-typescript": "^14.2.0",
    "@vue/test-utils": "^2.4.11",
    "@vue/tsconfig": "^0.9.1",
    "eslint": "^9.18.0",
    "eslint-plugin-vue": "^10.9.2",
    "jiti": "^2.4.2",
    "jsdom": "^29.1.1",
    "prettier": "^3.9.4",
    "typescript": "~6.0.3",
    "vite": "^8.1.3",
    "vite-ssg": "^28.3.0",
    "vitest": "^4.1.9",
    "vue-tsc": "^3.3.6"
  }
}
```

- [ ] **Step 6: 写 `vite.config.ts`**（SSG 冒烟断言：产物缺 title/noindex 即构建红——防 vite-ssg 与 unhead 版本不匹配时 head 静默失效）：

```ts
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
```

- [ ] **Step 7: 写 `index.html`**（favicon 用本仓拷贝的品牌资产；robots meta 与响应头三重兜底之一）：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- 兜底页不参与收录：meta / X-Robots-Tag 响应头 / robots.txt 三重声明 -->
    <meta name="robots" content="noindex, nofollow" />
    <link rel="icon" type="image/png" href="/brand/favicon-32.png" />
    <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
    <!-- title/lang 由 useHead 动态接管；此处保留英文文案作无 JS 兜底 -->
    <title>Nothing here · MintPop</title>
    <meta
      name="description"
      content="This address isn't home to any MintPop product — it may have moved, or the URL may be mistyped."
    />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: 拷贝品牌资产 + 写 robots.txt**

```bash
mkdir -p public/brand
cp ../mintpop-standards/docs/public/assets/brand/icon/mintpop-icon-256.png public/brand/
cp ../mintpop-standards/docs/public/assets/brand/favicon/favicon-32.png public/brand/
cp ../mintpop-standards/docs/public/assets/brand/favicon/favicon-16.png public/brand/
cp ../mintpop-standards/docs/public/assets/brand/favicon/apple-touch-icon.png public/brand/
printf 'User-agent: *\nDisallow: /\n' > public/robots.txt
```

- [ ] **Step 9: 安装工具链与依赖（含字体）**

```bash
mise trust && mise install
mise run install
mise exec -- pnpm add @fontsource/fredoka @fontsource/inter
```

Expected: `node_modules` 就绪；`package.json` dependencies 出现两个 `@fontsource/*`（^ 最新 5.x）。

- [ ] **Step 10: 提交**

```bash
git add -A
git commit -m "chore: 项目脚手架（mise/vite-ssg/eslint/prettier）与品牌静态资产"
```

> 注：此时 `src/` 尚不存在，`mise run build` 还跑不通——由 Task 4/5 补齐后验证，本任务只保证依赖安装成功。

---

### Task 2: 语言判定与安全存储（TDD）

**Files:**

- Create: `src/config/locale.ts`、`src/utils/safeStorage.ts`
- Test: `src/config/locale.test.ts`、`src/utils/safeStorage.test.ts`

**Interfaces:**

- Produces:
  - `Locale`（const 对象 + 类型，`Locale.EN = 'en'`、`Locale.ZH = 'zh'`）
  - `LOCALE_LABELS: Record<Locale, string>`（`en → 'EN'`，`zh → '中文'`）
  - `STORAGE_KEY_LOCALE = 'mintpop-locale'`
  - `detectLocale(saved: string | null, navigatorLanguage: string | undefined): Locale`
  - `safeStorageGet(key: string): string | null` / `safeStorageSet(key: string, value: string): void`

- [ ] **Step 1: 拷贝主站 safeStorage（成熟实现，逐字复用）**

```bash
mkdir -p src/utils src/config
cp ../mintpop-website/src/utils/safeStorage.ts ../mintpop-website/src/utils/safeStorage.test.ts src/utils/
```

- [ ] **Step 2: 写 locale 判定的失败测试** `src/config/locale.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import { detectLocale, Locale } from './locale'

describe('detectLocale', () => {
  it('localStorage 记忆优先于浏览器语言', () => {
    expect(detectLocale(Locale.EN, 'zh-CN')).toBe(Locale.EN)
    expect(detectLocale(Locale.ZH, 'en-US')).toBe(Locale.ZH)
  })

  it('无记忆时按 navigator.language 判定（含 zh 判中文）', () => {
    expect(detectLocale(null, 'zh-CN')).toBe(Locale.ZH)
    expect(detectLocale(null, 'zh-TW')).toBe(Locale.ZH)
    expect(detectLocale(null, 'en-US')).toBe(Locale.EN)
    expect(detectLocale(null, 'ja-JP')).toBe(Locale.EN)
  })

  it('记忆值非法（历史脏数据）时忽略、继续按浏览器语言判定', () => {
    expect(detectLocale('jp', 'zh-CN')).toBe(Locale.ZH)
  })

  it('navigator.language 缺失时回退英文', () => {
    expect(detectLocale(null, undefined)).toBe(Locale.EN)
  })
})
```

- [ ] **Step 3: 跑测试确认失败**

Run: `mise run test`
Expected: FAIL —— `Cannot find module './locale'`（或等价报错）

- [ ] **Step 4: 写最小实现** `src/config/locale.ts`：

```ts
/**
 * 语言常量：成员名按全局规范 SCREAMING_SNAKE_CASE；
 * 取值是小写 BCP-47 码（'en'/'zh'）——进 <html lang> 与 vue-i18n API，
 * 外部标准要求小写，按「技术符号例外」处理。
 */
export const Locale = {
  EN: 'en',
  ZH: 'zh',
} as const

export type Locale = (typeof Locale)[keyof typeof Locale]

/** 语言切换器的显示标签：展示目标语言自己的名字 */
export const LOCALE_LABELS: Record<Locale, string> = {
  [Locale.EN]: 'EN',
  [Locale.ZH]: '中文',
}

/** 语言偏好持久化键：与主站同一约定 */
export const STORAGE_KEY_LOCALE = 'mintpop-locale'

/**
 * 语言判定（纯函数）：localStorage 记忆 > navigator.language（含 zh 判中文）> 英文。
 * 兜底页不做 URL 语言前缀（全站 noindex、无 SEO 诉求），语言纯运行时判定。
 */
export function detectLocale(saved: string | null, navigatorLanguage: string | undefined): Locale {
  if (saved === Locale.EN || saved === Locale.ZH) {
    return saved
  }
  return navigatorLanguage?.toLowerCase().startsWith('zh') ? Locale.ZH : Locale.EN
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `mise run test`
Expected: PASS（locale.test.ts 全绿；safeStorage.test.ts 随拷贝自带、同样全绿）

- [ ] **Step 6: 提交**

```bash
git add src
git commit -m "feat: 语言判定纯函数与 localStorage 安全读写"
```

---

### Task 3: 中英文案与 i18n 装配（TDD）

**Files:**

- Create: `src/locales/en.ts`、`src/locales/zh.ts`、`src/locales/index.ts`
- Test: `src/locales/messages.test.ts`

**Interfaces:**

- Consumes: `Locale`（Task 2）
- Produces:
  - `createAppI18n()`（返回 vue-i18n 实例，legacy: false，默认/回退 EN）
  - 文案 key：`landing.title / landing.placeholderHost / landing.description / landing.cta / landing.pageTitle / landing.switchLocale / landing.logoAlt / landing.footer`

- [ ] **Step 1: 写 key 一致性失败测试** `src/locales/messages.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import en from './en'
import zh from './zh'

/** 递归展开对象的全部叶子 key 路径（如 landing.title） */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null
      ? keyPaths(value as Record<string, unknown>, path)
      : [path]
  })
}

describe('locales', () => {
  it('中英文案 key 完全一致（漏译/多译都报错）', () => {
    expect(keyPaths(zh).sort()).toEqual(keyPaths(en).sort())
  })

  it('文案值非空', () => {
    for (const messages of [en, zh]) {
      const flatten = keyPaths(messages)
      expect(flatten.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `mise run test`
Expected: FAIL —— `Cannot find module './en'`（或等价报错）

- [ ] **Step 3: 写文案与装配**

`src/locales/en.ts`（英文为真相源，zh 以其结构为类型约束）：

```ts
// 英文词条 —— 文案真相源；zh.ts 以本文件结构为类型约束
export default {
  landing: {
    title: "There's nothing popping here.",
    placeholderHost: 'this address',
    description:
      "This address isn't home to any MintPop product — it may have moved, or the URL may be mistyped.",
    cta: 'Take me to mintpop.ai',
    pageTitle: 'Nothing here · MintPop',
    switchLocale: 'Switch language',
    logoAlt: 'MintPop',
    footer: 'MintPop · Pop into something fresh.',
  },
}
```

`src/locales/zh.ts`：

```ts
import en from './en'

// 中文词条：satisfies 保证与英文结构逐 key 对齐（漏译在编译期报错）
export default {
  landing: {
    title: '这里空空如也',
    placeholderHost: '这个地址',
    description: '这个地址不属于任何 MintPop 产品——它可能已经搬家，也可能是地址拼错了。',
    cta: '去 MintPop 主站',
    pageTitle: '这里没有内容 · MintPop',
    switchLocale: '切换语言',
    logoAlt: 'MintPop',
    footer: 'MintPop · Pop into something fresh.',
  },
} satisfies typeof en
```

`src/locales/index.ts`：

```ts
import { createI18n } from 'vue-i18n'

import { Locale } from '@/config/locale'

import en from './en'
import zh from './zh'

// 每次应用创建时新建 i18n 实例：SSG 构建期与客户端各建各的，避免状态串扰
export function createAppI18n() {
  return createI18n({
    legacy: false,
    locale: Locale.EN,
    fallbackLocale: Locale.EN,
    messages: {
      [Locale.EN]: en,
      [Locale.ZH]: zh,
    },
  })
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `mise run test`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/locales
git commit -m "feat: 中英文案与 vue-i18n 装配"
```

---

### Task 4: 页面本体与样式（TDD）

**Files:**

- Create: `src/App.vue`、`src/views/LandingView.vue`、`src/main.ts`、`src/styles/theme.css`、`src/styles/base.css`
- Test: `src/views/LandingView.test.ts`

**Interfaces:**

- Consumes: `createAppI18n()`（Task 3）、`Locale / LOCALE_LABELS / STORAGE_KEY_LOCALE / detectLocale / safeStorageGet / safeStorageSet`（Task 2）
- Produces: vite-ssg 入口 `createApp`（`main.ts` 导出）；catch-all 路由（任意路径渲染 LandingView）

> 结构说明：spec 里「App.vue 即页面本体」在 vite-ssg 下落地为 App.vue 作 `<RouterView />` 壳 + `views/LandingView.vue` 承载页面（vite-ssg 必须经路由渲染页面组件），职责不变。

- [ ] **Step 1: 写页面行为的失败测试** `src/views/LandingView.test.ts`：

```ts
import { beforeEach, describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'
import { createHead } from '@unhead/vue/client'

import { STORAGE_KEY_LOCALE } from '@/config/locale'
import { createAppI18n } from '@/locales'

import LandingView from './LandingView.vue'

function mountLanding() {
  return mount(LandingView, {
    global: { plugins: [createAppI18n(), createHead()] },
  })
}

describe('LandingView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('渲染英文标题与回主站按钮', () => {
    const wrapper = mountLanding()
    expect(wrapper.get('h1').text()).toBe("There's nothing popping here.")
    const cta = wrapper.get('a.cta')
    expect(cta.attributes('href')).toBe('https://mintpop.ai')
    expect(cta.text()).toBe('Take me to mintpop.ai')
  })

  it('挂载后域名药丸显示 location.hostname', () => {
    const wrapper = mountLanding()
    // jsdom 默认 location 为 http://localhost:3000/
    expect(wrapper.get('.host-pill').text()).toContain(window.location.hostname)
  })

  it('点语言切换：文案变中文并写入 localStorage', async () => {
    const wrapper = mountLanding()
    await wrapper.get('.locale-switch').trigger('click')
    expect(wrapper.get('h1').text()).toBe('这里空空如也')
    expect(localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('zh')
    // 再切回英文
    await wrapper.get('.locale-switch').trigger('click')
    expect(wrapper.get('h1').text()).toBe("There's nothing popping here.")
    expect(localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('en')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `mise run test`
Expected: FAIL —— `Cannot find module './LandingView.vue'`（或等价报错）

- [ ] **Step 3: 写样式**

`src/styles/theme.css`（设计基线变量，浅色单主题）：

```css
/*
 * 主题变量：取品牌设计基线默认值（standards.mintpop.ai/global/design-baseline）。
 * 兜底页只做浅色单主题（单屏提示页，克制优先，不做暗色分支）。
 * 字体 Fredoka（展示）/ Inter（正文）经 Fontsource 自托管，在 main.ts 引入。
 */
:root {
  --font-sans:
    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-display: 'Fredoka', var(--font-sans);

  --mint: #17d1a7;
  --mint-deep: #0fb389;
  --bg: #f4f8f6;
  --card: #ffffff;
  --text: #0b0b0c;
  --text2: #6b7280;
  --border: #e5e7eb;
}
```

`src/styles/base.css`：

```css
/* 全局基础样式：重置 + 键盘焦点可见性 */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

a {
  text-decoration: none;
  color: inherit;
}

/* 键盘可达性：仅键盘导航时显示品牌色焦点环 */
:focus-visible {
  outline: 2px solid var(--mint-deep);
  outline-offset: 3px;
  border-radius: 4px;
}

#app {
  min-height: 100vh;
}
```

- [ ] **Step 4: 写页面组件** `src/views/LandingView.vue`：

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

import { Locale, LOCALE_LABELS, STORAGE_KEY_LOCALE } from '@/config/locale'
import { safeStorageSet } from '@/utils/safeStorage'

const { t, locale } = useI18n()

// SSG 预渲染期没有 window：先渲染占位文案，客户端挂载后填入真实域名
const hostname = ref('')
onMounted(() => {
  hostname.value = window.location.hostname
})

const otherLocale = computed<Locale>(() => (locale.value === Locale.ZH ? Locale.EN : Locale.ZH))

function switchLocale() {
  // 先取目标再赋值：赋值后 otherLocale 立即反转，直接读会存错值
  const target = otherLocale.value
  locale.value = target
  safeStorageSet(STORAGE_KEY_LOCALE, target)
}

useHead({
  title: () => t('landing.pageTitle'),
  htmlAttrs: { lang: () => locale.value },
})
</script>

<template>
  <main class="landing">
    <button
      class="locale-switch"
      type="button"
      :aria-label="t('landing.switchLocale')"
      @click="switchLocale"
    >
      {{ LOCALE_LABELS[otherLocale] }}
    </button>

    <div class="content">
      <img
        class="mark"
        src="/brand/mintpop-icon-256.png"
        :alt="t('landing.logoAlt')"
        width="72"
        height="72"
      />
      <h1 class="title">{{ t('landing.title') }}</h1>
      <p class="host-pill">
        <code>{{ hostname || t('landing.placeholderHost') }}</code>
      </p>
      <p class="description">{{ t('landing.description') }}</p>
      <a class="cta" href="https://mintpop.ai">{{ t('landing.cta') }}</a>
    </div>

    <footer class="footer">{{ t('landing.footer') }}</footer>
  </main>
</template>

<style scoped>
.landing {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.locale-switch {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
  color: var(--text2);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.locale-switch:hover {
  color: var(--text);
  border-color: var(--mint);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 520px;
  text-align: center;
}

.title {
  margin: 8px 0 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(28px, 6vw, 40px);
  line-height: 1.2;
}

.host-pill {
  margin: 0;
  padding: 4px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
  color: var(--text2);
  font-size: 14px;
}

.host-pill code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.description {
  margin: 0;
  color: var(--text2);
  font-size: 15px;
  line-height: 1.7;
}

.cta {
  margin-top: 8px;
  padding: 12px 28px;
  border-radius: 6px;
  background: var(--mint);
  color: var(--text);
  font-weight: 600;
  font-size: 15px;
  transition: background-color 0.2s ease;
}

.cta:hover {
  background: var(--mint-deep);
}

.footer {
  position: absolute;
  bottom: 24px;
  color: var(--text2);
  font-size: 13px;
}
</style>
```

- [ ] **Step 5: 写壳与入口**

`src/App.vue`：

```vue
<template>
  <RouterView />
</template>
```

`src/main.ts`：

```ts
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
```

- [ ] **Step 6: 跑测试确认通过**

Run: `mise run test`
Expected: PASS（LandingView 3 个用例全绿，此前用例不回归）

- [ ] **Step 7: 提交**

```bash
git add src index.html
git commit -m "feat: 兜底页页面本体（单屏布局、域名药丸、语言切换、SSG 入口）"
```

---

### Task 5: 构建链路验证

**Files:**

- 无新文件（只跑门禁，发现问题就地修）

- [ ] **Step 1: 跑完整质量门禁**

```bash
mise run format
mise run lint
mise run test
mise run build
```

Expected: 全绿；build 末尾输出 `SSG head smoke check passed`；`dist/index.html` 存在。

- [ ] **Step 2: 人工冒烟（本地预览）**

```bash
mise run preview
```

浏览器打开输出的地址确认：图标、标题、域名药丸（显示 localhost）、按钮、右上角切换器均正常；切中文后刷新仍是中文（localStorage 记忆）。确认后 Ctrl-C 退出。

- [ ] **Step 3: 提交（若门禁过程中有修复）**

```bash
git add -A
git commit -m "fix: 构建门禁修复"   # 无改动则跳过本步
```

---

### Task 6: Docker 镜像、nginx 404 语义与 compose

**Files:**

- Create: `Dockerfile`、`Dockerfile.dockerignore`、`nginx.conf`、`docker-compose.yml`

**Interfaces:**

- Consumes: `mise run install --frozen`、`mise run build`（Dockerfile 内使用）
- Produces: 镜像 `mintpop-landing:local`；运行行为——页面路径 404 + 兜底 HTML、静态资源 200、全站 `X-Robots-Tag`

- [ ] **Step 1: 拷贝 Dockerfile（逐字复用主站，任务名/文件布局完全相同）**

```bash
cp ../mintpop-website/Dockerfile .
```

- [ ] **Step 2: 写 `Dockerfile.dockerignore`**（黑名单式，pattern 相对仓库根）：

```
# per-Dockerfile ignore：BuildKit 优先用本文件，不读根 .dockerignore
node_modules
dist
dist-ssr
.git
.github
.idea
.claude
.vscode
*.log
.DS_Store
# 构建用不到的部署/文档文件
docker-compose.yml
README.md
docs
```

- [ ] **Step 3: 写 `nginx.conf`**（全站 404 语义的核心实现）：

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;

    # 安全响应头 + 全站禁止收录（wildcard 子域不该被搜索引擎当成真实站点）。
    # HSTS/CSP 不在此设：TLS 由 Cloudflare 边缘终结，容器内是纯 HTTP。
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Robots-Tag "noindex, nofollow" always;

    # 压缩：官方镜像默认关闭，显式开启；woff2 已压缩不列入
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        text/css
        text/plain
        text/xml
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # 带内容 hash 的构建产物（含自托管字体），长期强缓存。
    # add_header 不叠加继承：本 location 有自己的 add_header 后，
    # server 级的头对此路径全部失效，必须在此重复一份。
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-Robots-Tag "noindex, nofollow" always;
        try_files $uri =404;
    }

    # 品牌图（favicon/图标，无内容 hash，不设长缓存）
    location /brand/ {
        try_files $uri =404;
    }

    # robots.txt 正常 200：既给爬虫读 Disallow，也当探活端点（页面路径全是 404）
    location = /robots.txt {
    }

    # ===== 兜底语义：所有页面路径一律 404，响应体用预渲染的兜底页 =====
    # error_page 内部跳转到 /index.html 时，精确匹配的 location 直接出文件；
    # internal 禁止外部直接以 200 访问 /index.html，避免旁路出「正常页」。
    error_page 404 /index.html;

    location = /index.html {
        internal;
    }

    location / {
        return 404;
    }
}
```

- [ ] **Step 4: 写 `docker-compose.yml`**：

```yaml
# 生产部署：拉取 GHCR 已发布镜像运行。
#   - 默认拉 latest，可用 LANDING_TAG 指定版本：LANDING_TAG=0.1.0 docker compose up -d
#   - 宿主端口可用 LANDING_PORT 覆盖（默认 80）
#   - 镜像为私有时，服务器需先 `docker login ghcr.io`
#   - 镜像由 CI（release.yml）构建推送；本地构建用 `mise run image`，不归 compose 管
services:
  web:
    image: ghcr.io/mintpopai/mintpop-landing:${LANDING_TAG:-latest}
    container_name: mintpop-landing
    restart: unless-stopped
    ports:
      # 只绑宿主 127.0.0.1，对外由宿主反向代理/Cloudflare 隧道接管
      - '127.0.0.1:${LANDING_PORT:-80}:80'
    healthcheck:
      # 页面路径按设计一律返回 404，探活用恒为 200 的 robots.txt
      test: ['CMD-SHELL', 'wget -qO- http://127.0.0.1/robots.txt >/dev/null 2>&1 || exit 1']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 5s
```

- [ ] **Step 5: 构建镜像并验证 404 语义**

```bash
mise run image
docker run -d --rm --name landing-smoke -p 18080:80 mintpop-landing:local
sleep 2
# ① 根路径：404 + 响应体是兜底页
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:18080/          # 期望 404
curl -s http://localhost:18080/ | grep -c "Nothing here"                  # 期望 ≥1
# ② 任意深路径：同样 404 + 兜底页
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:18080/foo/bar   # 期望 404
# ③ 静态资源 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:18080/robots.txt                 # 期望 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:18080/brand/mintpop-icon-256.png # 期望 200
ASSET=$(docker exec landing-smoke sh -c 'ls /usr/share/nginx/html/assets | head -n1')
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:18080/assets/${ASSET}"          # 期望 200
# ④ noindex 响应头 + /index.html 不可旁路直访
curl -sI http://localhost:18080/ | grep -i 'x-robots-tag'                 # 期望 noindex, nofollow
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:18080/index.html # 期望 404（internal 拦截）
docker stop landing-smoke
```

Expected: 状态码与内容全部符合行内注释的期望值；任一不符须先修 nginx.conf 再重跑本步。

- [ ] **Step 6: 提交**

```bash
git add Dockerfile Dockerfile.dockerignore nginx.conf docker-compose.yml
git commit -m "feat: Docker 镜像与 nginx 全站 404 兜底语义、compose 部署清单"
```

---

### Task 7: GitHub Actions 工作流

**Files:**

- Create: `.github/workflows/quality.yml`、`.github/workflows/ci.yml`、`.github/workflows/release.yml`、`.github/workflows/action-notify.yml`

**Interfaces:**

- Consumes: mise tasks（install/format/lint/test/build，Task 1）；`Dockerfile`（Task 6）
- Produces: PR/push 门禁；`v*` tag → 质量门禁 → GHCR 镜像 → GitHub Release；飞书通知

- [ ] **Step 1: 逐字拷贝三份与主站完全同构的 workflow**

```bash
mkdir -p .github/workflows
cp ../mintpop-website/.github/workflows/quality.yml .github/workflows/
cp ../mintpop-website/.github/workflows/ci.yml .github/workflows/
cp ../mintpop-website/.github/workflows/action-notify.yml .github/workflows/
```

（quality：install --frozen → format --check → lint → test → build；ci：PR/push main 调 quality；action-notify：监听 `CI`、`Release`，与本仓 workflow name 一致，无需改动。）

- [ ] **Step 2: 拷贝 release.yml 并改 Release 标题**

```bash
cp ../mintpop-website/.github/workflows/release.yml .github/workflows/
```

把 `Create Release` step 里的

```yaml
name: MintPop ${{ github.ref_name }}
```

改为

```yaml
name: MintPop Landing ${{ github.ref_name }}
```

其余逐字保留（`env.IMAGE: ghcr.io/${{ github.repository }}` 会自动解析为本仓镜像名，无需改）。

- [ ] **Step 3: 语法自检**

```bash
mise exec -- pnpm dlx yaml-lint .github/workflows/*.yml || python3 -c "
import yaml, glob
for f in glob.glob('.github/workflows/*.yml'):
    yaml.safe_load(open(f)); print(f, 'ok')
"
```

Expected: 四个文件全部解析通过（两条命令任一通过即可）。

- [ ] **Step 4: 提交**

```bash
git add .github
git commit -m "ci: 质量门禁、发版（GHCR + GitHub Release）与飞书通知工作流"
```

> 仓库建到 GitHub 后需配置 secrets：`FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_RECEIVE_ID`（GHCR 用内置 `GITHUB_TOKEN`，无需额外配置）。写进 Task 8 的 README。

---

### Task 8: README 与收尾

**Files:**

- Create: `README.md`

- [ ] **Step 1: 写 `README.md`**：

````markdown
# mintpop-landing

MintPop 未配置子域名的统一兜底页：Cloudflare 上 `*.mintpop.ai` wildcard 解析指到本站，
用户访问打错的 / 已迁移下线的子域时，看到品牌提示页并被导流回主站 [mintpop.ai](https://mintpop.ai)。

## 行为约定

- **所有页面路径（含根路径）返回 HTTP 404**，响应体是预渲染的兜底页——对爬虫/监控诚实表达
  「此地址无内容」，避免 wildcard 子域被当成无数重复站点收录（软 404）。
- 静态资源（`/assets/`、`/brand/`、`robots.txt`）正常 200；探活请用 `/robots.txt`。
- 全站 `noindex, nofollow`（响应头 + meta + robots.txt 三重）。
- 中英双语：`localStorage 偏好 > navigator.language（含 zh 判中文）> 英文`，不走 URL 前缀。
- 不做「旧子域 → 新地址」映射：真要迁移某子域，请在 DNS/网关层做 301。

## 技术栈

Vue 3 + vite-ssg 预渲染（catch-all 单路由）· vue-i18n · @unhead/vue ·
字体 Fredoka/Inter 经 Fontsource 自托管（不外链 Google Fonts）· nginx 托管。

## 常用命令（一律走 mise）

```bash
mise run install     # 安装依赖（CI/镜像构建加 --frozen）
mise run run         # 本地开发服务器
mise run test        # 单元测试（Vitest）
mise run lint        # ESLint
mise run format      # Prettier（CI 加 --check）
mise run build       # 类型检查 + SSG 构建（含产物 head 冒烟断言）
mise run image       # 本地构建生产镜像 mintpop-landing:local
mise run up / down   # compose 拉起 / 停止部署容器
mise run release     # 发版（patch+1 或显式传版本号，tag 触发 CI 发布）
```

## 部署

1. 服务器 `docker login ghcr.io`（私有镜像时），准备本仓 `docker-compose.yml`；
2. `LANDING_TAG=<版本> LANDING_PORT=<端口> docker compose up -d`（缺省 latest / 80，只绑 127.0.0.1，对外由宿主反代/Cloudflare 接管）；
3. **Cloudflare**：为 `mintpop.ai` 添加 wildcard 记录 `*` 指向部署机并开启代理（橙云）。
   已单独配置的具体子域记录优先于 wildcard，互不影响；迁移下线某子域时删掉它的专属记录即可自动落到本站。

## GitHub 配置

- 发版：`mise run release [vX.Y.Z] ["更新说明"]`，tag `v*` 触发 release.yml
  （质量门禁 → 构建推送 GHCR → 创建 GitHub Release）。
- 仓库 secrets：`FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_RECEIVE_ID`（流水线飞书通知）。
````

- [ ] **Step 2: 全量门禁终跑**

```bash
mise run format --check
mise run lint
mise run test
mise run build
```

Expected: 全绿。任何一步红都要先修复再继续。

- [ ] **Step 3: 提交**

```bash
git add README.md
git commit -m "docs: README（行为约定、命令、部署与 Cloudflare wildcard 说明）"
```

---

## 完成定义

- `mise run format --check && mise run lint && mise run test && mise run build` 全绿；
- `mise run image` 后按 Task 6 Step 5 的 curl 清单逐条验证通过；
- 本地 `mise run preview` 人工确认页面视觉与语言切换；
- git 历史为按任务的小步提交。

后续人工事项（不在本计划内）：GitHub 建仓推送、配置 secrets、服务器 compose 部署、Cloudflare wildcard 解析。
