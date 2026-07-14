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

  it('挂载后域名药丸显示 location.hostname', async () => {
    const wrapper = mountLanding()
    // onMounted 的赋值在下一个渲染刷新周期才反映到 DOM
    await nextTick()
    expect(wrapper.get('.host-pill').text()).toContain(window.location.hostname)
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
