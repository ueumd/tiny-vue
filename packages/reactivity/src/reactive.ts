import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandler'

const reactiveMap = new WeakMap()

export function reactive(target) {
  if (!isObject(target)) {
    return
  }

  const proxy = new Proxy(target, mutableHandlers)
}
