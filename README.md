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
