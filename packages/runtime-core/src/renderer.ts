import { isString, ShapeFlags } from '@tiny-vue/shared'
import { createVNode, Text } from './vnode'

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp
    // 文本节点 ， 元素中的内容
  } = renderOptions

  const normalize = child => {
    if (isString(child)) {
      // 处理文本 Text
      //  renderer.render(h(Text, 'hello'), app)
      return createVNode(Text, null, child)
    }

    return child
  }

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalize(children[i])
      patch(null, child, container)
    }
  }

  const mountElement = (vnode, container) => {
    console.log(vnode)
    const { type, props, children, shapeFlag } = vnode

    // 创建元素 并将真实节点挂载到虚拟节点上
    const el = (vnode.el = hostCreateElement(type))

    if (props) {
      // 处理属性
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag && ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, children)
    } else if (shapeFlag && ShapeFlags.ARRAY_CHILDREN) {
      // 子节点
      mountChildren(children, el)
    }

    // 都创建完成后，插入元素节点
    hostInsert(el, container)
  }

  // 处理文本
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children)
      hostInsert(n2.el, container)
    }
  }

  const patch = (n1, n2, container) => {
    if (n1 === n2) return

    const { type, shapeFlag } = n2

    if (n1 === null) {
      switch (type) {
        case Text:
          processText(n1, n2, container)
          break
        default:
          if (shapeFlag && ShapeFlags.ELEMENT) {
            // 初次渲染
            mountElement(n2, container)
          }
      }
    } else {
      // 更新流程
    }
  }

  const render = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        // 卸载
      }
    } else {
      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode
  }

  return {
    render
  }
}
