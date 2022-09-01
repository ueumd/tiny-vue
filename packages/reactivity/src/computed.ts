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
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl<T> {
  public effect

  // 默认取值时进行计算
  public _dirty = true

  public __v_isReadonly = true
  public __v_isRef = true

  public dep = new Set()

  private _value!: T

  constructor(getter: ComputedGetter<T>, public setter: ComputedSetter<T>) {
    /**
     *  computed 底层是一个 effect
     *
     *  const fullName2 = computed(() => {
     *      console.log('runner')
     *      return state.name1 + state.name2
     *  })
     */

    this.effect = new ReactiveEffect(getter, () => {
      // 属性变化化会执行调度函数
      if (!this._dirty) {
        this._dirty = true
      }
    })
  }

  get value() {
    if (this._dirty) {
      this._dirty = false
      // 只有属性变化时 才会更新
      // return this.fn()
      this._value = this.effect.run()
    }
    return this._value
  }

  set value(newValue) {
    this.setter(newValue)
  }
}
