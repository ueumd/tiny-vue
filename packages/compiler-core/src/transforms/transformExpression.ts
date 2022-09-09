import { NodeTypes } from '../ast'

export function transformExpression(node, context) {
  // {{name}} -> _ctx.name
  // 是不是表达式
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content)
  } else if (node.type === NodeTypes.ELEMENT) {
    //处理动态的props参数
    node.props = node.props.map(prop => {
      if (prop.type === NodeTypes.DIRECTIVE) {
        const exp = prop.exp
        if (exp.type === NodeTypes.SIMPLE_EXPRESSION && !exp.isStatic) {
          exp.content = `_ctx.${exp.content}`
        }
      }
      return prop
    })
  }
}

function processExpression(node) {
  node.content = `_ctx.${node.content}`
  return node
}
