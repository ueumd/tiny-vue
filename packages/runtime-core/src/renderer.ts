import { isString, ShapeFlags } from '@tiny-vue/shared'
import { createVNode, Text, isSameVNode } from './vnode'

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

  const normalize = (children, i) => {
    if (isString(children[i])) {
      // 处理文本 Text
      //  renderer.render(h(Text, 'hello'), app)
      const vnode = createVNode(Text, null, children[i])
      children[i] = vnode
    }

    return children[i]
  }

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalize(children, i)
      patch(null, child, container)
    }
  }

  const mountElement = (vnode, container) => {
    const { type, props, children, shapeFlag } = vnode

    // 创建元素 并将真实节点挂载到虚拟节点上
    const el = (vnode.el = hostCreateElement(type))

    if (props) {
      // 处理属性
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 子节点
      mountChildren(children, el)
    }

    // 都创建完成后，插入元素节点
    hostInsert(el, container)
  }

  // 处理文本
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    } else {
      // 文本内容变化

      // 节点复用
      const el = (n2.el = n1.el)
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children)
      }
    }
  }

  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      mountElement(n2, container)
    } else {
      // 更新
      patchElement(n1, n2)
    }
  }

  // 对比属性
  const patchProps = (oldProps, newProps, el) => {
    // 用新的盖掉老的
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }

    for (const key in oldProps) {
      // 旧的有，新的没有，删除
      if (newProps[key] === null) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  /**
   * 比较两个虚拟节点的子节点差异
   * @param n1
   * @param n2
   * @param el 当前父节点
   *
   *
   * 新儿子    旧儿子     操作方式
   * 文本     数组        （删除老儿子，设置文本内容）
   * 文本     文本        （更新文本即可）
   * 文本     空          （更新文本即可) 与上面的类似
   * 数组     数组        （diff算法）
   * 数组     文本        （清空文本，进行挂载）
   * 数组     空          （进行挂载） 与上面的类似
   * 空       数组        （删除所有儿子）
   * 空       文本        （清空文本）
   * 空       空          （无需处理）
   */
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children
    const c2 = n2.children

    const prevShapeFlag = n1.shapeFlag // 之前
    const shapeFlag = n2.shapeFlag // 之后

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 文本 数组 （删除旧节点，设置文本内容）
        // 删除所有节点
        unmountChildren(c1)
      }
      if (c1 !== c2) {
        // 文本 文本（空）  （更新文本）
        hostSetElementText(el, c2)
      }
    } else {
      // 数组 或 空

      // 数组 与 数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // DIFF 算法
        } else {
          // 现在不是数组 （文本 或 空） 删除以前的
          unmountChildren(c1)
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 数组 文本
          hostSetElementText(el, '')
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 数组 文本
          mountChildren(c2, el)
        }
      }
    }
  }

  /**
   * 更新逻辑
   *  1. 前后完全没关系，删除旧的，添加新的
   *  2. 新旧一样，复用。属性不一样，在对比属性，更新属性
   *  3. 子节点
   */
  const patchElement = (n1, n2) => {
    const el = (n2.el = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}

    // 对比属性
    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }

  const patch = (n1, n2, container) => {
    if (n1 === n2) return

    const { type, shapeFlag } = n2

    // 更新逻辑
    // 判断两元素是否相同，不相同卸载
    if (n1 && !isSameVNode(n1, n2)) {
      // 删除旧节点
      unmount(n1)
      n1 = null
    }

    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag && ShapeFlags.ELEMENT) {
          // 初次渲染
          processElement(n1, n2, container)
        }
    }
  }

  const unmount = vnode => {
    hostRemove(vnode.el)
  }

  const render = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        // 卸载
        unmount(container._vnode)
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
