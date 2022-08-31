import { isFunction, NOOP } from '@vue/shared'
import { ReactiveEffect } from './effect'

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void

export function computed<T>(getterOrOptions) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>
  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.s
  }

  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl<T> {
  public effect
  public _dirty = true

  public __v_isReadonly = true
  public __v_isRef = true

  public dep = new Set()

  private _value!: T

  constructor(getter: ComputedGetter<T>, setter: ComputedSetter<T>) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
      }
    })
  }

  get value() {}
}
