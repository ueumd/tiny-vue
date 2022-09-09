import { NodeTypes } from './ast'

function createTransformContext(root, { nodeTransforms = [], directiveTransforms = {} }) {
  // 创建上下文
  const context = {
    //当前正在转换的节点
    currentNode: root,

    //当前转换节点的父节点
    parent: null,

    //当前节点在父节点children中的索引
    childIndex: 0,
    helpers: new Map(),
    // 存入个性化的插件
    nodeTransforms,
    directiveTransforms,
    removeNode(node) {
      if (context.parent) {
        context.parent.childIndex.splice(context.childIndex, 1)
        context.currentNode = null
      }
    },
    replaceNode(node) {
      context.parent.children[context.childIndex] = node
      context.currentNode = node
    },
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    }
  }

  return context
}

export function transform(root, options) {
  // 创建上下文
  const context = createTransformContext(root, options)

  // 遍历节点
  traverse(root, context)

  createRootCodegen(root)
}

function traverse(node, context) {
  context.currentNode = node
}

function createRootCodegen(root) {
  const { children } = root
  if (children.length === 1) {
    const child = children[0]
    if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
      const codegenNode = child.codegenNode
      root.codegenNode = codegenNode
    } else {
      root.codegenNode = child
    }
  } else if (children.length > 1) {
    //TODO Fragment多根节点
  }
}
