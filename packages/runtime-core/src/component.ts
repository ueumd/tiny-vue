import { hasOwn, isFunction, ShapeFlags } from '@tiny-vue/shared'
import { initProps } from './componentProps'
import { reactive } from '@tiny-vue/reactivity'

export function createComponentInstance(vnode) {
  const instance = {
    data: null,
    vnode,
    subTree: null, // vnode 组件的虚拟节点   subTree渲染的组件内容
    isMounted: false,
    update: null,
    propsOptions: vnode.type.props,
    props: {},
    attrs: {},
    proxy: null,
    render: null,
    setupState: {},
    slots: {}
  }

  return instance
}

const publicPropertyMap = {
  $attrs: i => i.attrs,
  $slots: i => i.slots
}

const publicInstaceProxy = {
  get(target, key) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    }

    const getter = publicPropertyMap[key]
    if (getter) {
      return getter(target)
    }
  },
  set(target, key, value) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
    } else if (hasOwn(setupState, key)) {
      setupState[key] = value
    } else if (props && hasOwn(props, key)) {
      console.warn('attempting to mutate prop ' + (key as string))
      return false
    }
    return true
  }
}

function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children
  }
}

export function setupComponent(instance) {
  const { props, type, children } = instance.vnode
  initProps(instance, props)
  initSlots(instance, children)

  instance.proxy = new Proxy(instance, publicInstaceProxy)

  const data = type.data

  if (data) {
    if (!isFunction(data)) {
      console.warn('data option must be a function')
      return
    }
    instance.data = reactive(data.call(instance.proxy))
  }

  // 组件render方法
  if (!instance.render) {
    instance.render = type.render
  }
}
