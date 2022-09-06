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
