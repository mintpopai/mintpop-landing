/**
 * localStorage 安全读写:隐私模式/禁用站点数据的浏览器里,localStorage 的
 * 属性访问与方法调用都会抛 SecurityError(SSG 构建期的 Node 环境则是未定义,
 * 裸引用抛 ReferenceError)——两类都由 try/catch 统一兜住,静默回退。
 * 与 index.html 防闪烁脚本的空 catch 同一标准:存储不可用只丢「记忆」功能,
 * 不得阻断主题切换、语言回跳等主流程。
 */

/** 读取存储值;存储不可用或无记录时返回 null */
export function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** 写入存储值;存储不可用时放弃持久化(仅影响记忆,不影响当次会话行为) */
export function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 见文件头注释:静默回退 */
  }
}
