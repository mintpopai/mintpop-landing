import en from './en'

// 中文词条：satisfies 保证与英文结构逐 key 对齐（漏译在编译期报错）
export default {
  landing: {
    title: '这里空空如也',
    placeholderHost: '这个地址',
    description: '这个地址不属于任何 MintPop 产品——它可能已经搬家，也可能是地址拼错了。',
    cta: '去 MintPop 主站',
    pageTitle: '这里没有内容 · MintPop',
    switchLocale: '切换语言',
    logoAlt: 'MintPop',
    footer: 'MintPop · Pop into something fresh.',
    notices: {
      title: '公告',
      consoleMigration: 'console.mintpop.ai 已迁移至 api.mintpop.ai。',
    },
  },
} satisfies typeof en
