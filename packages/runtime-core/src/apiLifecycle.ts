import { currentInstance, setCurrentInstance } from './component'

//生命周期枚举
export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec',
  SERVER_PREFETCH = 'sp'
}

/**
 * 创建生命周期函数
 * @param type
 * @returns
 */
function createHook(type) {
  return (hook, target = currentInstance) => {
    // hook 需要绑定到对应的实例上。 我们之前写的依赖收集
    if (target) {
      // 关联此currentInstance和hook
      const hooks = target[type] || (target[type] = [])
      const wrappedHook = () => {
        setCurrentInstance(target)
        hook() // 将当前实例保存到currentInstance上
        setCurrentInstance(null)
      }

      //一个组件实例中可以有多个相同的生命周期函数，所以需要用数组存着
      hooks.push(wrappedHook)
    } else {
      console.error('生命周期函数只能在setup中调用')
    }
  }
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)
