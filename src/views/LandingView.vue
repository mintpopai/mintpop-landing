<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

import { detectLocale, Locale, LOCALE_LABELS, STORAGE_KEY_LOCALE } from '@/config/locale'
import { safeStorageGet, safeStorageSet } from '@/utils/safeStorage'

const { t, locale } = useI18n()

// SSG 预渲染期没有 window：先渲染占位文案，客户端挂载后填入真实域名
// （只在 onMounted 赋值：水合首帧与预渲染 HTML 保持一致，避免 hydration mismatch）
const hostname = ref('')
onMounted(() => {
  hostname.value = window.location.hostname
  // 语言判定放在挂载后：水合首帧与预渲染英文 HTML 保持一致，避免 hydration mismatch；
  // 代价是中文用户首帧有一次英文闪现，这是 spec 选定的行为
  locale.value = detectLocale(safeStorageGet(STORAGE_KEY_LOCALE), navigator.language)
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
      <!-- 字标引用 standards.mintpop.ai（原图 1233×342），仓库内不留副本 -->
      <img
        class="mark"
        src="https://standards.mintpop.ai/assets/brand/wordmark/mintpop-wordmark-dark.png"
        :alt="t('landing.logoAlt')"
        width="162"
        height="45"
      />
      <!-- 标题三段一行书写：不引入空白文本节点，拼接结果与完整句子逐字一致 -->
      <h1 class="title">
        {{ t('landing.titlePre') }}<em class="title-mark">{{ t('landing.titleMark') }}</em
        >{{ t('landing.titlePost') }}
      </h1>
      <!-- 签名元素：装着错误域名的薄荷泡泡，入场时「pop」一下，旁伴两粒上浮小气泡 -->
      <p class="host-bubble">
        <span class="fizz fizz-a" aria-hidden="true"></span>
        <span class="fizz fizz-b" aria-hidden="true"></span>
        <code>{{ hostname || t('landing.placeholderHost') }}</code>
      </p>
      <p class="description">{{ t('landing.description') }}</p>
      <a class="cta" href="https://mintpop.ai">{{ t('landing.cta') }}</a>

      <section class="notices" :aria-label="t('landing.notices.title')">
        <h2 class="notices-title">{{ t('landing.notices.title') }}</h2>
        <ul class="notices-list">
          <li>{{ t('landing.notices.consoleMigration') }}</li>
        </ul>
      </section>
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
  /* 极淡薄荷光晕：让「薄荷汽水」的气息落在底色上，而非只点缀在按钮 */
  background: radial-gradient(640px 420px at 50% 30%, var(--mint-halo), transparent 70%);
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
  color: var(--ink);
  border-color: var(--mint);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 560px;
  text-align: center;
}

.mark {
  margin-bottom: 40px;
}

.title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(34px, 7vw, 54px);
  line-height: 1.15;
  color: var(--ink);
}

/* 强调词：薄荷波浪线，汽水的「咕嘟」感 */
.title-mark {
  font-style: normal;
  text-decoration: underline wavy var(--mint);
  text-decoration-thickness: 3px;
  text-underline-offset: 0.18em;
}

/* 签名元素：域名泡泡——渐变泡体 + 左上高光 + 薄荷投影 */
.host-bubble {
  position: relative;
  margin: 30px 0 0;
  padding: 12px 28px;
  border: 1.5px solid rgba(23, 209, 167, 0.45);
  border-radius: 999px;
  background: linear-gradient(135deg, var(--bubble-hi) 40%, var(--bubble-lo));
  box-shadow:
    0 12px 26px -14px rgba(15, 179, 137, 0.5),
    inset 0 -6px 12px rgba(23, 209, 167, 0.08);
}

.host-bubble::before {
  content: '';
  position: absolute;
  top: 7px;
  left: 20px;
  width: 24px;
  height: 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  transform: rotate(-18deg);
  filter: blur(1px);
}

.host-bubble code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(15px, 2.6vw, 17px);
  color: var(--ink);
}

/* 泡泡旁的两粒小气泡：缓慢上浮、循环消散 */
.fizz {
  position: absolute;
  border: 1.5px solid var(--mint);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
}

.fizz-a {
  top: -14px;
  right: 24px;
  width: 10px;
  height: 10px;
}

.fizz-b {
  top: -6px;
  right: 10px;
  width: 6px;
  height: 6px;
}

.description {
  margin: 22px 0 0;
  max-width: 46ch;
  color: var(--text2);
  font-size: 15px;
  line-height: 1.7;
}

.cta {
  margin-top: 28px;
  padding: 13px 32px;
  border-radius: 999px;
  background: var(--mint);
  color: var(--ink);
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 12px 22px -12px rgba(15, 179, 137, 0.55);
  transition:
    background-color 0.2s ease,
    transform 0.18s ease,
    box-shadow 0.2s ease;
}

.cta:hover {
  background: var(--mint-deep);
}

/* 公告区：瓶标式卡片，标题像贴纸一样骑在边框上 */
.notices {
  position: relative;
  margin-top: 44px;
  width: 100%;
  padding: 20px 22px 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
  text-align: left;
}

.notices-title {
  position: absolute;
  top: -9px;
  left: 18px;
  margin: 0;
  padding: 0 10px;
  background: var(--card);
  color: var(--ink);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.notices-title::before {
  content: '';
  display: inline-block;
  margin-right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--mint);
  vertical-align: 1px;
}

.notices-list {
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--text2);
  font-size: 14px;
  line-height: 1.7;
}

.footer {
  position: absolute;
  bottom: 24px;
  color: var(--text2);
  font-size: 13px;
}

/* 动效只在用户未要求减弱动态时启用；否则页面直接静止呈现 */
@media (prefers-reduced-motion: no-preference) {
  .mark,
  .title,
  .description,
  .cta,
  .notices,
  .footer {
    animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .title {
    animation-delay: 0.05s;
  }

  .host-bubble {
    animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: 0.18s;
  }

  .description {
    animation-delay: 0.3s;
  }

  .cta {
    animation-delay: 0.38s;
  }

  .notices {
    animation-delay: 0.48s;
  }

  .footer {
    animation-delay: 0.55s;
  }

  .cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 26px -12px rgba(15, 179, 137, 0.6);
  }

  /* backwards：入场延迟期间停在 0% 帧（透明），避免先闪现再消失 */
  .fizz-a {
    animation: fizz-rise 3.2s ease-in 1.2s infinite backwards;
  }

  .fizz-b {
    animation: fizz-rise 2.6s ease-in 2.2s infinite backwards;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.55);
  }

  45% {
    opacity: 1;
  }

  70% {
    transform: scale(1.06);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fizz-rise {
  0% {
    opacity: 0;
    transform: translateY(0);
  }

  25% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(-26px);
  }
}
</style>
