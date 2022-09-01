import { mutableHandlers } from './baseHandler'
import { isObject } from '@vue/shared'

export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  IS_SHALLOW = '__v_isShallow',
  RAW = '__v_raw'
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}

export const reactiveMap = new WeakMap<Target, any>()
export const shallowReactiveMap = new WeakMap<Target, any>()
export const readonlyMap = new WeakMap<Target, any>()
export const shallowReadonlyMap = new WeakMap<Target, any>()

export function reactive(target) {
  // if (isReadonly(target)) {
  //   return target
  // }

  return createReactiveObject(target, false, mutableHandlers, reactiveMap)
}

export function readonly(target) {
  return createReactiveObject(target, true, mutableHandlers, readonlyMap)
}

function createReactiveObject(target, isReadonly: boolean, mutableHandlers, proxyMap: WeakMap<Target, any>) {
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`)
    return target
  }

  /**
   * 重复代理
   * const data = {name: 'Tom', id: 1}
   * const state1 = reactive(data)
   * const state2 = reactive(state1)
   *
   *  第一次 访问时 data 对象 此时还没有经过 Proxy代理，此时 data 不会有get方法
   *
   *  第二次代理时 const state2 = reactive(state1)  state1 已经是代理对象
   *  此时判断 if (target[ReactiveFlags.IS_REACTIVE])，即在访问 target[ReactiveFlags.IS_REACTIVE]
   *  些时会执行state1对象的上get方法，此时 key 为 __v_isReactive
   */

  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  /**
   * 已缓存 直接返回
   * const data = {name: 'Tom', id: 1}
   * const state1 = reactive(data)
   * const state2 = reactive(data)
   */
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, mutableHandlers)

  // 缓存代理对象
  proxyMap.set(target, proxy)

  // 返回代理对象
  return proxy
}

export function isReadonly(value: unknown): boolean {
  return !!value[ReactiveFlags.IS_READONLY]
  // return !!(value && (value as Target)[ReactiveFlags.IS_READONLY])
}

export function isReactive(value: unknown): boolean {
  if (isReadonly(value)) {
    return isReactive((value as Target)[ReactiveFlags.RAW])
  }

  return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isProxy(value: unknown): boolean {
  return isReactive(value) || isReadonly(value)
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}
