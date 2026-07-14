import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { mount } from '@vue/test-utils'
import { createHead } from '@unhead/vue/client'

import { STORAGE_KEY_LOCALE } from '@/config/locale'
import { createAppI18n } from '@/locales'

import LandingView from './LandingView.vue'

function mountLanding() {
  return mount(LandingView, {
    global: { plugins: [createAppI18n(), createHead()] },
  })
}

describe('LandingView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('渲染英文标题与回主站按钮', () => {
    const wrapper = mountLanding()
    expect(wrapper.get('h1').text()).toBe("There's nothing popping here.")
    const cta = wrapper.get('a.cta')
    expect(cta.attributes('href')).toBe('https://mintpop.ai')
    expect(cta.text()).toBe('Take me to mintpop.ai')
  })

  it('渲染公告区及迁移公告', () => {
    const wrapper = mountLanding()
    expect(wrapper.get('.notices-title').text()).toBe('Notices')
    expect(wrapper.get('.notices-list').text()).toBe(
      'console.mintpop.ai has moved to api.mintpop.ai.',
    )
  })

  it('挂载后域名泡泡显示 location.hostname', async () => {
    const wrapper = mountLanding()
    // onMounted 的赋值在下一个渲染刷新周期才反映到 DOM
    await nextTick()
    expect(wrapper.get('.host-bubble').text()).toContain(window.location.hostname)
  })

  it('localStorage 记忆为 zh 时，挂载后自动切换为中文', async () => {
    localStorage.setItem(STORAGE_KEY_LOCALE, 'zh')
    const wrapper = mountLanding()
    await nextTick()
    expect(wrapper.get('h1').text()).toBe('这里空空如也')
  })

  it('点语言切换：文案变中文并写入 localStorage', async () => {
    const wrapper = mountLanding()
    await wrapper.get('.locale-switch').trigger('click')
    expect(wrapper.get('h1').text()).toBe('这里空空如也')
    expect(localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('zh')
    // 再切回英文
    await wrapper.get('.locale-switch').trigger('click')
    expect(wrapper.get('h1').text()).toBe("There's nothing popping here.")
    expect(localStorage.getItem(STORAGE_KEY_LOCALE)).toBe('en')
  })
})
