import { isArray, isObject } from '@tiny-vue/shared'
import { isVNode } from 'vue'
import { createVNode } from './vnode'

// 两个参数
// h('div', { id: 'foo' })

// 没有 prop 时可以省略不写
// h('div', 'hello')
// h('div', [h('span', 'hello')])

// 三个参数
// 写法1 h('div',{}, children)
// 写法1 h('div',{},h())
// 写法2 h('div',{},[children,children，children])

// 事件监听器应以 onXxx 的形式书写
// h('div', { onClick: () => {} })

/**
 * https://cn.vuejs.org/api/render-function.html#h
 * @param type
 * @param propOrChildren
 * @param children  文本 | 数组
 */
export function h(type, propsOrChildren, children = null) {
  const len = arguments.length
  if (len === 2) {
    /**
     * h('div', {style: {"color": "skyblue"}} )
     * h('div', h('span'))
     * h('div', [h('span'), h('span')])
     */
    // 对象 {}
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 虚拟节点
      if (isVNode(propsOrChildren)) {
        createVNode(type, null, [propsOrChildren])
      }
      return createVNode(type, propsOrChildren)
    } else {
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (len > 3) {
      //截取两个参数之后的参数作为children
      children = Array.from(arguments).splice(2)
    } else if (len === 3 && isVNode(children)) {
      // h('div', {}, h('span'))
      children = [children]
    }

    // other
    return createVNode(type, propsOrChildren, children)
  }
}
