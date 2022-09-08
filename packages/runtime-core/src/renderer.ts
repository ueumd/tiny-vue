import { invokeArrayFns, isString, PatchFlags, ShapeFlags } from '@tiny-vue/shared'
import { createVNode, Text, Fragment, isSameVNode } from './vnode'
import { getSequence } from './sequence'
import { reactive, ReactiveEffect } from '@tiny-vue/reactivity'
import { queueJob } from './scheduler'
import { hasPropsChanged, initProps } from './componentProps'
import { createComponentInstance, setupComponent } from './component'

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

  const mountElement = (vnode, container, anchor) => {
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
    hostInsert(el, container, anchor)
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

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container, anchor)
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
      if (newProps[key] === undefined) {
        hostPatchProp(el, key, oldProps[key], undefined)
      }
    }
  }

  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  // 比较两个子节点差异
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    // 从头开始 sync from start
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNode(n1, n2)) {
        // 比较两个节点的属性 和 子节点
        patch(n1, n2, el)
      } else {
        break
      }

      i++
    }

    // console.log(i, e1, e2)

    // 尾部开始 sync form end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }

    // console.log(i, e1, e2)

    // 情况1： 正常顺序
    // 同序列 挂载
    // common sequence + mount
    // i 比 e1大 说明有新增
    // i 和 e2 之间 是新增的部分
    // common-sequence-mount-abcd.html
    // common-sequence-mount-dabc.html
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          // 插入节点时往后插入还是往前插入
          // A B C -> A B C D  end
          // A B C -> D A B C  front
          const nextPos = e2 + 1

          // 参照节点
          const anchor = nextPos < c2.length ? c2[nextPos].el : null

          // 插入节点
          patch(null, c2[i], el, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 同序列 卸载
      // common sequence + unmount
      if (i <= e1) {
        while (i <= e1) {
          // 卸载不需要参考节点
          unmount(c1[i])
          i++
        }
      }
    }

    // 情况2： 乱序
    const s1 = i
    const s2 = i
    const keyToNewIndexMap = new Map() // key -> newIndex
    for (let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i)
    }

    const toBePatched = e2 - s2 + 1 // 新的总个数
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0) // 一个记录是否比对过的映射表

    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i] // 老的孩子
      const newIndex = keyToNewIndexMap.get(oldChild.key) // 用老的子节点去新的里面找
      if (newIndex == undefined) {
        unmount(oldChild) // 多余的删掉
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1 // 用来标记当前所patch过的结果
        patch(oldChild, c2[newIndex], el)
      }
    }

    // 获取最长递增子序列
    const increment = getSequence(newIndexToOldIndexMap)

    // 需要移动位置
    let j = increment.length - 1
    for (let i = toBePatched - 1; i >= 0; i--) {
      const index = i + s2
      const current = c2[index] // 找到h
      const anchor = index + 1 < c2.length ? c2[index + 1].el : null
      if (newIndexToOldIndexMap[i] === 0) {
        patch(null, current, el, anchor)
      } else {
        if (i != increment[j]) {
          hostInsert(current.el, el, anchor)
        } else {
          j--
        }
      }
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
          patchKeyedChildren(c1, c2, el) // 全量对比
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

  const patchBlockChildren = (n1, n2) => {
    for (let i = 0; i < n2.dynamicChildren.length; i++) {
      patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i])
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

    const { patchFlag } = n2

    // class
    if (patchFlag & PatchFlags.CLASS) {
      if (oldProps.class != newProps.class) {
        hostPatchProp(el, 'class', null, newProps.class)
      }
      // ...
    } else {
      // 对比属性
      patchProps(oldProps, newProps, el)
    }

    if (n2.dynamicChildren) {
      patchBlockChildren(n1, n2)
    } else {
      patchChildren(n1, n2, el)
    }
  }

  const processFragment = (n1, n2, container) => {
    if (n1 === null) {
      mountChildren(n2.children, container)
    } else {
      patchChildren(n1, n2, container)
    }
  }

  const mountComponent2 = (vnode, container, anchor) => {
    const { data = () => ({}), render, props: propOptions } = vnode.type
    const state = reactive(data())

    // 组件实例
    const instance = {
      state,
      vnode,
      subTree: null, //渲染组件的内容
      isMounted: false,
      update: null,
      propOptions,
      props: {},
      attrs: {},
      proxy: null
    }

    initProps(instance, vnode.props)

    instance.proxy = new Proxy(instance, {
      get(target, key) {
        const { state, props } = target
      }
    })

    // 区分初始化 还是更新
    const componentUpdateFn = () => {
      console.log('componentUpdateFn')
      if (!instance.isMounted) {
        // 初始化
        const subTree = render.call(state)

        // 创建subTree 真实节点
        patch(null, subTree, container, anchor)
        instance.subTree = subTree
        instance.isMounted = true
      } else {
        // 更新
        const subTree = render.call(state)
        patch(instance.subTree, subTree, container, anchor)
        instance.subTree = subTree
      }
    }

    // 异步更新
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update))

    // 强制更新逻辑保存到组件实例上
    const update = (instance.update = effect.run.bind(effect))
    update()
  }

  const mountComponent = (vnode, container, anchor) => {
    // 1. 创建组件实例
    const instance = (vnode.components = createComponentInstance(vnode))

    // 2. 实例赋值
    setupComponent(instance)

    // 3. 创建一个effect
    setupRenderEffect(instance, container, anchor)
  }

  const setupRenderEffect = (instance, container, anchor) => {
    const { render } = instance
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance
        if (bm) {
          invokeArrayFns(bm)
        }
        // 组件挂载
        const subTree = render.call(instance.proxy, instance.proxy)
        patch(null, subTree, container, anchor)
        instance.subTree = subTree
        instance.isMounted = true

        if (m) {
          invokeArrayFns(m)
        }
      } else {
        // 组件内部更新

        const { bu, u } = instance
        if (bu) {
          invokeArrayFns(bu)
        }

        const subTree = render.call(instance.proxy, instance.proxy)
        patch(instance.subTree, subTree, container, anchor)
        instance.subTree = subTree

        if (u) {
          invokeArrayFns(u)
        }
      }
    }

    // 异步更新
    // this.count++
    // this.count++
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update))
    const update = (instance.update = effect.run.bind(effect))
    update()
  }

  const shouldUpdateComponent = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1
    const { props: nextProps, children: nextChildren } = n2
    if (prevProps === nextProps) return false
    if (prevChildren || nextChildren) {
      return true
    }
    return hasPropsChanged(prevProps, nextProps)
  }

  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component)

    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2
      instance.update()
    }

    // 属性更新
    // updateProps(instance,prevProps,nextProps)
  }

  // 组件
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 组件挂载
      mountComponent(n2, container, anchor)
    } else {
      // 组件更新 props!!!
      updateComponent(n1, n2)
    }
  }

  const patch = (n1, n2, container, anchor = null) => {
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
      case Fragment: // 无用标签
        processFragment(n1, n2, container)
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素
          // 初次渲染
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor)
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
