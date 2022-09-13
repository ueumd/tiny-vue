import { baseParse } from './parse'
import { transform } from './transform'
import { transformExpression } from './transforms/transformExpression'
import { generate } from './codegen'

export function baseCompile(template, options = {}) {
  const ast = baseParse(template)

  //将template AST 语法树转换成 JavaScript AST语法树
  transform(
    ast,
    Object.assign({}, options, {
      nodeTransforms: [transformExpression]
    })
  )

  //返回生成的渲染函数结果
  return generate(
    ast,
    Object.assign({}, options, {
      //扩展的选项
    })
  )
}
