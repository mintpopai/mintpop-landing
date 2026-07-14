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
