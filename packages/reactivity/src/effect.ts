import { EffectScope } from './EffectScope'

export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectOptions {
  // 是否懒加载，如果是true调用effect不会立即执行监听函数，由用户手动触发
  lazy?: boolean

  // 被触发引起effect要重新收集依赖时的调度器
  // 当传入时effect收到触发时不会重新执行监听函数而是执行这个function，由用户自己调度。
  scheduler?: EffectScheduler
  scope?: EffectScope
  allowRecurse?: boolean

  // 当effect被stop（停止监听）时的钩子
  onStop?: () => void
}

export let activeEffect: ReactiveEffect | undefined = undefined

function cleanupEffect(effect) {
  effect.deps.forEach(dep => {
    // 解除effect，重新依赖收集
    dep.delete(effect)
  })
  effect.deps.length = 0
}

export class ReactiveEffect {
  parent: ReactiveEffect | undefined = undefined

  deps: Array<any> = []

  // 默认激活状态
  active = true

  constructor(public fn) {
    this.fn = fn
  }

  /**
   * 执行 effect
   */
  run() {
    if (!this.active) {
      // 非激活状态，只需要执行内部函数，无需进行依赖收集
      return this.fn()
    }

    // try {
    //   activeEffect = this
    //   return this.fn()
    // } finally {
    //   activeEffect = undefined
    // }

    try {
      /**
       * this.parent = activeEffect
       *  解决 effect 多层 嵌套
       */
      this.parent = activeEffect
      activeEffect = this

      // 在执行用户函数之前将之前收集的内容清空
      cleanupEffect(this)

      // 默认执行一次
      return this.fn()
    } finally {
      // effect(() => {
      //   console.log('render1')
      //   state.name
      // })
      // effect 内部函数体执行后才会执行到这里
      activeEffect = this.parent
    }
  }

  stop() {
    if (this.active) {
      this.active = false
      // 停止effect的收集
      cleanupEffect(this)
    }
  }
}

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  // 实例化
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

// 多层级嵌套
// effect(()=>{      // parent = null;  activeEffect = e1
//     state.name    // name -> e1

//     effect(()=>{  // parent = e1   activeEffect = e2
//         state.id   // id -> e2
//     })

//     state.address // activeEffect = this.parent

//     effect(()=>{  // parent = e1   activeEffect = e3
//         state.id // id -> e3
//     })
// })

/**
 {对象：{ 属性 :[ dep, dep ]}}

 const target1 = { flag: true, name: 'Tom', id: 1 }

 targetMap
 {
    target1: {
      name: [ReactiveEffect, ReactiveEffect]
      id: [ReactiveEffect, ReactiveEffect]
    }
 }
 */
const targetMap = new WeakMap()

/**
 * 对象属性的依赖收集
 * 一个 effect 对应多个属性
 * 一个 属性 对应多个 effect
 * @param target
 * @param type
 * @param key
 */
export function track(target, type, key) {
  if (!isTracking()) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    // 第一次 需要初始化
    // 缓存
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    // {对象：{ 属性 :[ dep, dep ]}}
    depsMap.set(key, (dep = new Set()))
  }

  // 去重
  const shouldTrack = !dep.has(activeEffect)
  if (shouldTrack) {
    dep.add(activeEffect)

    // effect 记录对应的dep
    activeEffect.deps.push(dep)
  }
}

// 更新
export function trigger(target, type, key, vlaue, oldValue) {
  const depsMap = targetMap.get(target)
  // 触发的值不在模板中使用
  if (!depsMap) return

  // 获取属性对应的effect
  let effects = depsMap.get(key)

  // dead loop
  // 执行之前 拷贝一份执行 不进关联引用
  if (effects) {
    effects = new Set(effects)
  }

  effects.forEach(effect => {
    if (effect !== activeEffect) {
      effect.run()
    }
  })
}

export function isTracking() {
  return activeEffect !== undefined
}
