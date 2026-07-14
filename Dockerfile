# syntax=docker/dockerfile:1
# ============================================================================
# MintPop 前端生产镜像（多阶段）
#   - 构建阶段：干净 slim 底座 + curl 装 mise，按根 mise.toml 装 node/pnpm，产出 dist
#   - 运行阶段：nginx 仅托管静态产物，构建工具链不进最终镜像
#   工具链版本只认根 mise.toml 的 [tools]；Dockerfile 里唯一钉死的版本是 mise 自身。
# ============================================================================

# ---- 构建阶段 ----
FROM debian:13-slim AS build

# mise 自身版本（自举工具无法由 mise.toml 管，唯一允许在此钉死的版本）
ENV MISE_VERSION=v2026.6.0
ENV MISE_DATA_DIR=/mise \
    MISE_CONFIG_DIR=/mise \
    MISE_CACHE_DIR=/mise/cache \
    MISE_INSTALL_PATH=/usr/local/bin/mise \
    PATH=/mise/shims:$PATH
# 关掉 mise run 跑 task 前的「自动装全部 [tools]」：本镜像只显式装 node/pnpm，
# 避免 mise run build 又把其它工具链一并拉下来，破坏「只装所需工具」与镜像瘦身。
ENV MISE_TASK_RUN_AUTO_INSTALL=false
# libatomic1：mise 装的 pnpm 独立二进制运行时依赖它（slim 底座默认不带，缺则 pnpm 报 libatomic.so.1）
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl git ca-certificates libatomic1 \
    && rm -rf /var/lib/apt/lists/* \
    && curl https://mise.run | sh

WORKDIR /app

# 只装该镜像需要的工具（node + pnpm），不 mise install 全装
COPY mise.toml ./
RUN mise trust && mise install node pnpm

# 先 COPY 依赖清单并安装（层缓存：改源码不重装依赖；改清单才重装）
# 安装走 mise run，命令与本地/CI 单一来源；--frozen 按 lockfile 精确还原（可复现构建）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN mise run install --frozen

# 再 COPY 源码与构建配置，执行类型检查 + 构建
# 构建走 mise run，命令与本地/CI 单一来源（不在 Dockerfile 里重抄 vue-tsc/vite-ssg）
COPY . .
RUN mise run build

# ---- 运行阶段 ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
