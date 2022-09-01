import { hasChanged } from '@vue/shared'
import { toReactive } from './reactive'
import { trackEffects, triggerEffects } from './effect'

declare const RefSymbol: unique symbol
export interface Ref<T = any> {
  value: T
  /**
   * Type differentiator only.
   * We need this to be in public d.ts but don't want it to show up in IDE
   * autocomplete, so we use a private Symbol instead.
   */
  [RefSymbol]: true
}

export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}

export function ref(value: unknown) {
  return createRef(value, false)
}

export function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }

  // 返回一个类的实例
  return new RefImpl(rawValue, shallow)
}

class RefImpl {
  public dep = new Set()
  public _value

  public readonly __v_isRef = true

  constructor(public rawValue, public readonly __v_isShallow: boolean) {
    this._value = toReactive(rawValue)
  }

  get value() {
    // 依赖收集
    trackEffects(this.dep)
    return this._value
  }

  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) {
      this._value = toReactive(newValue)
      this.rawValue = newValue
      triggerEffects(this.dep)
    }
  }
}
