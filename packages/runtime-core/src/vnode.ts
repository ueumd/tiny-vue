import { isString, isFunction, isObject, ShapeFlags, isArray } from '@tiny-vue/shared'

/**
 * https://astexplorer.net/
 * @param type
 * @param props
 * @param children
 * @param patchFlag
 */
export function createVNode(type, props, children = null, patchFlag = 0) {
  // 组合方案 shapeFlag  我想知道一个元素中包含的是多个儿子还是一个儿子  标识
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0

  const vnode = {
    type,
    props,
    children,
    el: null,
    key: props?.['key'],
    __v_isVnode: true,
    shapeFlag,
    patchFlag
  }

  if (children) {
    let type = 0
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag |= type
  }

  return vnode
}
