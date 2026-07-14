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
