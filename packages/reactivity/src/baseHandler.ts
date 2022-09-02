import { Target, readonly, reactive, ReactiveFlags } from './reactive'
import { track, trigger } from './effect'
import { hasChanged, isObject } from '@tiny-vue/shared'

const get = createGetter()
const set = createSetter()

function createGetter(isReadonly = false, shllow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    const res = Reflect.get(target, key, receiver)

    // 取值进行依赖收集
    track(target, 'get', key)

    // isReadonly

    // shallow

    // isRef

    if (isObject(res)) {
      // 深度代理，取值就可以实现
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

function createSetter() {
  return function set(target: object, key: string | symbol, value: unknown, receiver: object) {
    const oldValue = target[key]
    const result = Reflect.set(target, key, value, receiver)

    if (hasChanged(value, oldValue)) {
      // 更新
      trigger(target, 'set', key, value, oldValue)
    }

    return result
  }
}

export const mutableHandlers = {
  get,
  set
}

// export const mutableHandlers = {
//   get(target, key, receiver) {
//     const res = Reflect.get(target, key, receiver)
//
//     return res
//   },
//   set(target, key, value, receiver) {
//     const result = Reflect.set(target, key, value, receiver)
//     return result
//   }
// }
