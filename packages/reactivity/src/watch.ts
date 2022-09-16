import { isFunction, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'

/**
 * 递归访问注册依赖
 * @param value
 * @param seen
 * @returns
 */
function traversal(value, set = new Set()) {
  if (!isObject(value)) return value
  if (set.has(value)) {
    return value
  }
  set.add(value)
  for (const key in value) {
    traversal(value[key], set)
  }
  return value
}

/**
 * watch
 * @param source 检测的对象
 * @param cb 检测到source变化后触发的函数
 */
export function watch(source, cb) {
  let getter
  let cleanup

  if (isReactive(source)) {
    // 是对象,说明当前的的对象的所有属性都需要监听，直接递归
    getter = () => traversal(source)
  } else if (isFunction(source)) {
    getter = source
  } else {
    return
  }

  // 保存用户的函数
  const onCleanup = fn => {
    cleanup = fn
  }

  let oldValue

  const job = () => {
    if (cleanup) cleanup()
    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter, job)
  oldValue = effect.run()
}
