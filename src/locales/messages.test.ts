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

/** 递归收集对象的全部叶子值 */
function leafValues(obj: Record<string, unknown>): unknown[] {
  return Object.values(obj).flatMap((value) =>
    typeof value === 'object' && value !== null
      ? leafValues(value as Record<string, unknown>)
      : [value],
  )
}

describe('locales', () => {
  it('中英文案 key 完全一致（漏译/多译都报错）', () => {
    expect(keyPaths(zh).sort()).toEqual(keyPaths(en).sort())
  })

  it('文案值非空', () => {
    for (const messages of [en, zh]) {
      const values = leafValues(messages)
      expect(values.length).toBeGreaterThan(0)
      for (const value of values) {
        expect(typeof value).toBe('string')
        expect(value).not.toBe('')
      }
    }
  })
})
