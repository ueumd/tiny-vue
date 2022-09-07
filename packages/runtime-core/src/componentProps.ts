import { hasOwn } from '@tiny-vue/shared'
import { reactive } from '@tiny-vue/reactivity'

export function initProps(instance, rawProps) {
  const props: any = {}
  const attrs = {}
  const options = instance.propsOptions || {}

  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]
      if (hasOwn(options, key)) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }

  /**
   * shallowReactive
   */
  instance.props = reactive(props)
  instance.attrs = attrs
}

export const hasPropsChanged = (prevPros = {}, nextProps = {}) => {
  const nextKeys = Object.keys(nextProps)

  // 对比属性 前后个数是否一致
  if (nextKeys.length !== Object.keys(nextProps).length) {
    return true
  }

  // 比对属性对应的值是否一致  {Com:{xxx:xxx}} {Com:{yyy:yyy}}
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (nextKeys[key] !== prevPros[key]) {
      return true
    }
  }

  return false
}

export function updateProps(prevProps, nextProps) {
  for (const key in nextProps) {
    prevProps[key] = nextProps[key]
  }

  for (const key in nextProps) {
    if (!hasOwn(nextProps, key)) {
      delete prevProps[key]
    }
  }
}
