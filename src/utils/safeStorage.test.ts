import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { safeStorageGet, safeStorageSet } from './safeStorage'

// 模拟「隐私模式/禁用站点数据」:此时 localStorage 的方法调用(乃至属性访问本身)
// 会抛 SecurityError。安全读写必须静默回退,不得让主题切换/语言回跳等主流程炸掉。
function stubThrowingStorage() {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new DOMException('denied', 'SecurityError')
    },
    setItem: () => {
      throw new DOMException('denied', 'SecurityError')
    },
  })
}

describe('safeStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('正常环境:get 读回 set 写入的值', () => {
    safeStorageSet('k', 'v')
    expect(safeStorageGet('k')).toBe('v')
  })

  it('正常环境:无记录时 get 返回 null', () => {
    expect(safeStorageGet('missing')).toBeNull()
  })

  it('存储不可用:get 抛错时静默返回 null', () => {
    stubThrowingStorage()
    expect(safeStorageGet('k')).toBeNull()
  })

  it('存储不可用:set 抛错时静默不抛(放弃持久化)', () => {
    stubThrowingStorage()
    expect(() => safeStorageSet('k', 'v')).not.toThrow()
  })
})
