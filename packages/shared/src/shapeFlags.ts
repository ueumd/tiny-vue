/**
 * vue3提供的形状标识
 * 组件的类型
 */
export const enum ShapeFlags {
  // 最后要渲染的 element 类型
  ELEMENT = 1,

  // 组件类型
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,

  // vnode 的 children 为 string 类型
  TEXT_CHILDREN = 1 << 3,

  // vnode 的 children 为数组类型
  ARRAY_CHILDREN = 1 << 4,

  // vnode 的 children 为 slots 类型
  SLOTS_CHILDREN = 1 << 5,


  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}
