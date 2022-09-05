import { createRenderer } from '@tiny-vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

const rendererOptions = Object.assign(nodeOps, { patchProp }) //浏览器平台渲染包含的所有api

// 渲染器
let renderer

// function ensureRenderer() {
//   return renderer || (renderer = createRenderer<Node, Element | ShadowRoot>(rendererOptions))
// }
//
// export function render(...args) {
//   ensureRenderer().render(...args)
// }

// export function createApp(...args) {
//   const app = ensureRenderer().createApp(...args)
//
//   const { mount } = app
//
//   // 重写 mount 方法
//   // app.mount = () => {}
//
//   return app
// }

export { patchProp }
