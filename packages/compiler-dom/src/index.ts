import { parserOptions } from './parserOption'
import { baseParse, baseCompile } from '@tiny-vue/compiler-core'
import { extend } from '@tiny-vue/shared'

export { parserOptions }

export function parse(template: string) {
  return baseParse(template)
}

export function compile(template: string, options) {
  const ast = baseCompile(
    template,
    extend({}, parserOptions, options, {
      //扩展options
    })
  )
  console.log('ast', ast)
  return ast
}

export * from '@tiny-vue/compiler-core'
