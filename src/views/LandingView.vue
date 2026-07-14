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
        width="216"
        height="60"
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
