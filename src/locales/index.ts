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
