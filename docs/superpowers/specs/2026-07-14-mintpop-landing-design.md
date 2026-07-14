# MintPop Landing（未配置子域名兜底页）设计文档

> 日期：2026-07-14 · 状态：已与用户逐节确认

## 1. 背景与目标

- MintPop 在 Cloudflare 上为 `*.mintpop.ai` 配置 wildcard 解析，所有**未单独配置**的子域名（用户打错地址、或子域已迁移下线）都会路由到本项目。
- 目标：给落到错误子域的用户一张品牌化的提示页，说明「这个地址没有内容」，并把用户导流回主站 `mintpop.ai`。
- 非目标：不做「旧子域 → 新地址」迁移映射（真要迁移某子域，在 DNS/网关层做 301）；不放产品入口列表（产品导航由主站承担，兜底页保持零维护）。

## 2. 页面视觉与内容

单屏居中布局（不滚动），遵循品牌设计基线（浅色克制、Mint 点缀）：

- 背景 Cloud `#F4F8F6`，中央内容区最大宽度约 520px。
- 自上而下：
  1. **Pop Mark 图标**（`mintpop-icon-256.png`，约 72px 显示）；
  2. **大标题**（Fredoka SemiBold）：EN `There's nothing popping here.` / ZH `这里空空如也`；
  3. **域名药丸标签**：等宽字体、浅底描边，客户端 mounted 后填入 `location.hostname`；SSG 预渲染阶段显示占位（EN `this address` / ZH `这个地址`）；
  4. **说明文字**（Inter，次要文本 `#6B7280`）：EN `This address isn't home to any MintPop product — it may have moved, or the URL may be mistyped.` / ZH `这个地址不属于任何 MintPop 产品——它可能已经搬家，也可能是地址拼错了。`；
  5. **主按钮**（Mint `#17D1A7`，hover `#0FB389`，圆角 6px）：EN `Take me to mintpop.ai` / ZH `去 MintPop 主站`，链接 `https://mintpop.ai`；
  6. **页脚小字**：`MintPop · Pop into something fresh.`。
- 右上角 **EN / 中文切换器**（药丸样式）。
- 可访问性：正文对比度 ≥ 4.5:1，按钮/切换器有可见 hover 与 focus 态。
- 品牌资产：Pop Mark 图标与 favicon 从 mintpop-standards 的 `docs/public/assets/brand/` **原样拷贝**进本仓 `public/brand/`（同一份原图，不重绘、不改动）。

## 3. 语言（i18n）

- 中英双语，**不走 URL 前缀**（与主站的有意偏离：本页全站 noindex、无 SEO 诉求，无需语言进 URL）。
- 判定顺序：`localStorage 偏好 > navigator.language（含 zh 判中文）> 英文`。
- SSG 只预渲染英文一份；客户端 mounted 后按判定切换。手动切换写 localStorage（键 `mintpop-locale`，复用主站约定与 safeStorage 工具）。

## 4. 架构与项目结构

技术栈与 mintpop-website 同构：**Vue 3 + vite-ssg + vue-i18n + @unhead/vue**，TypeScript，pnpm，工具链锁根 `mise.toml`（node/pnpm 版本对齐主站）。

- 路由仅两条：`/` 与 `/:pathMatch(.*)*` catch-all，均指向同一页面组件——错误子域下任意路径都显示本页。
- 字体自托管 Fontsource：`@fontsource/fredoka`（600）+ `@fontsource/inter`（400/500/600）；无任何第三方外链，可达性由「全部同源 + 站点走 Cloudflare」保证。

```
mintpop-landing/
├── mise.toml / package.json / vite.config.ts / tsconfig*.json
├── eslint.config.ts / vitest.setup.ts
├── index.html
├── public/
│   ├── brand/…             # Pop Mark 图标 + favicon（拷自 mintpop-standards）
│   └── robots.txt          # 全站 Disallow
├── src/
│   ├── main.ts             # ViteSSG 入口 + Fontsource 字体引入
│   ├── App.vue             # 页面本体（单屏，全部内容在此）
│   ├── config/locale.ts    # Locale 常量 + navigator.language 判定纯函数
│   ├── locales/{en,zh}.ts  # 文案
│   ├── styles/{theme,base}.css
│   └── utils/safeStorage.ts  # 照抄主站
├── Dockerfile / Dockerfile.dockerignore / nginx.conf / docker-compose.yml
└── .github/workflows/{ci,quality,release,action-notify}.yml
```

## 5. HTTP 语义与 SEO

- **所有页面请求一律返回 404 状态码**（含根路径）：响应体是本兜底页 HTML，用户视觉无差别；对爬虫/监控/脚本诚实表达「此地址无内容」，避免 wildcard 子域被当成无数重复站点收录（软 404 问题）。
  - nginx 要点：`error_page 404 /index.html;` 配 `location = /index.html { internal; }`（精确匹配直接出文件、仅供内部跳转，避免内部跳转再次命中 `return 404` 变成空响应体）；页面路径统一 `location / { return 404; }`；**静态资源路径显式放行**（`/assets/` 指纹产物、`/brand/` 品牌图、`robots.txt`、favicon 系列），正常 200，否则页面自身的 JS/CSS/图标也会被 404 拦住。
- 全站响应头加 `X-Robots-Tag: noindex, nofollow`；`robots.txt` 全站 Disallow。
- `<title>`：`Nothing here · MintPop`（中文态 `这里没有内容 · MintPop`），由 @unhead/vue 管理。

## 6. 部署与 CI/CD

全部照抄 mintpop-website 模式（单组件仓命名，不带组件名）：

- **Docker**：多阶段 Dockerfile（debian-13-slim + curl 装 mise → 按根 mise.toml 装 node/pnpm → `mise run build` 产 dist → nginx:1.27-alpine 托管），`Dockerfile.dockerignore`（黑名单式），单架构。
- **compose**：`docker-compose.yml`，镜像 `ghcr.io/<owner>/mintpop-landing:${LANDING_TAG:-latest}`，端口 `${LANDING_PORT:-80}:80`，`restart: unless-stopped`；healthcheck 按「HTTP 有响应即健康」写（页面本身返回 404，不能用默认「2xx 才健康」判定）。
- **workflows**：
  - `quality.yml`（`workflow_call` 复用）：install --frozen → lint → format --check → typecheck → test；
  - `ci.yml`（PR / push main 触发）：调用 quality；
  - `release.yml`（`v*` tag 触发）：质量门禁（needs quality）→ buildx + metadata-action 推 GHCR → 建 GitHub Release（annotated tag 注释置顶 + changelog-builder 按提交类型过滤，空正文兜底）；
  - `action-notify.yml`：飞书流水线通知（监听 CI / Release 的 name）。
- **mise tasks**：`install / run / preview / typecheck / lint / test / format / build / image / up / down / release`，release 脚本照主站（双可选参数按形状消歧、git 内置版本排序取最新 tag、发版前五项校验）。
- **域名接入**（部署侧手工操作，写进 README）：Cloudflare 上将 `*.mintpop.ai` wildcard 记录指向部署机并开启代理；已配置的具体子域记录优先于 wildcard，互不影响。

## 7. 测试

Vitest + jsdom，小而有效：

- `config/locale.ts`：语言判定纯函数（`zh-CN` / `zh-TW` / `en-US` / 空值 / 非法 localStorage 值）；
- `App.vue`：挂载后渲染标题与主按钮；hostname 药丸 mounted 后显示 `location.hostname`；语言切换更新文案并写 localStorage；
- locales：中英文案 key 一致性校验。

## 8. 错误处理要点

- localStorage 不可用（隐私模式/禁用）：safeStorage 静默降级，语言仅按 navigator.language 判定；
- SSG 构建期无 window/navigator：所有浏览器 API 访问收在 mounted/客户端分支，预渲染产物为英文 + 占位域名；
- JS 加载失败：预渲染 HTML 仍完整可读（英文文案 + 占位域名 + 主按钮为普通 `<a>`），导流不依赖 JS。
