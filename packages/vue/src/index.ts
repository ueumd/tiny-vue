import { compile, CompilerOptions } from '@tiny-vue/compiler-dom'
import * as runtimeDom from 'tiny-vue/runtime-dom'

import { isString } from '@tiny-vue/shared'
import { registerRuntimeCompiler } from '@tiny-vue/runtime-core'

function compileToFunction(
  template: string | HTMLElement,
  options: CompilerOptions,
  isGlobal = true //默认全局模式，即直接在script中引入 xxx.global.js 否则就是module(此模式必须启动一个服务器再打开页面才行)
) {
  if (!isString(template)) {
    //不是字符说明是Html元素
    template = template.innerHTML
  }

  console.log(2222, template)

  //template是一个id选择器
  if (template[0] === '#') {
    const el = document.querySelector(template)

    if (!el) {
      console.warn('没有找到当前的元素')
    }

    template = el ? el.innerHTML : ''
  }

  // @ts-ignore
  const { code } = compile(template, options)

  console.log(111111111, code)

  const render = isGlobal ? new Function(code)() : new Function('TinyVue', code)(runtimeDom)
  return render
}

registerRuntimeCompiler(compileToFunction)

export { compileToFunction as compile }
export * from '@tiny-vue/reactivity'
export * from '@tiny-vue/runtime-dom'
