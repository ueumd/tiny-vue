import { hasOwn, isFunction, isObject, ShapeFlags } from '@tiny-vue/shared'
import { initProps } from './componentProps'
import { reactive, proxyRefs } from '@tiny-vue/reactivity'
import { NOOP } from '@tiny-vue/shared'

export let currentInstance = null
export const setCurrentInstance = instance => (currentInstance = instance)
export const getCurrentInstance = () => currentInstance

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

  const setup = type.setup
  if (setup) {
    const setupContext = {
      emit: (event, ...args) => {
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
        // 找到虚拟节点的属性有存放props
        const handler = instance.vnode.props[eventName]
        handler && handler(...args)
      },
      attrs: instance.attrs,
      slots: instance.slots
    }
    setCurrentInstance(instance)
    const setupResult = setup(instance.props, setupContext)
    setCurrentInstance(null)

    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else if (isObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult)
    }
  }

  // 组件render方法
  // if (!instance.render) {
  //   instance.render = type.render
  // }

  finishComponentSetup(instance, false)
}

//组件安装完成的处理
function finishComponentSetup(instance, isSSR) {
  const Component = instance.vnode
  const { render } = Component.type

  // 如果执行完setup发现没有instance.render或者setup是空的,
  if (!instance.render) {
    // 执行组件的render并值给instance.render
    instance.render = render

    // 如果组件也没有写render函而是写的template => 就要执行模板编译把template编译成render函数
    //如果当前是SSR服务端渲染直接跳过
    if (!render && !isSSR) {
      //如果组件选项存在template,调用编译器生成render函数
      if (compile && Component.template) {
        //赋值给render选项
        Component.render = compile(Component.template, {}, Component.isGlobal)
        //Component.isGlobal这个是我自己加的一个变量，为了区分当前引入mini-vue3的环境
      }
    }

    instance.render = Component.type.render || NOOP
  }

  //applyOptions 此处需要创建vue2支持的optionsApi beforeCreated钩子在这里执行
  setCurrentInstance(instance) //必须要设置当前实例，使在options中能够获取上下文
  // pauseTracking() //options中响应式变量需要暂停依赖收集
  // applyOptions(instance)
  // enableTracking() //执行完成后开启依赖收集
  setCurrentInstance(null) //执行完后需要设置为空
}

type CompileFunction = (template: string | object, options?, isGlobal?: boolean) => any

let compile: CompileFunction

//注册运行时的编译器
export function registerRuntimeCompiler(_compile: any) {
  compile = _compile
}
