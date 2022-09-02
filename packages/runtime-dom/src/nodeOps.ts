/**
 * DOM 节点 属性 操作
 * 增 删 改 查
 */
export const nodeOps = {
  insert: (child, parent, anchor = null) => {
    parent.insertBefore(child, anchor)
  },
  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  createElement: tag => {
    return document.createElement(tag)
  },
  setElementText: (el, text) => {
    // <div>hello</div>
    el.textContent = text
  },
  createComment: text => {
    return document.createComment(text)
  },
  createText: text => {
    return document.createTextNode(text)
  },
  //设置节点的内容
  setText: (node, text) => {
    node.nodeValue = text
  },
  // 获取父节眯
  parentNode: node => node.parentNode,
  // 获取下一个兄弟节点
  nextSibling: node => node.nextSibling,
  // 容器第一个节点
  firstChild: container => container.firstChild,
  querySelector: selector => document.querySelector(selector)
}
