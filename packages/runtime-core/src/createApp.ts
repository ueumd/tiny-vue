import { createVNode } from './vnode'

/**
 1. 创建根组件对应的vnode
 2. 根据vnode邦定上下文context
 3. 渲染vnode成真实节点，并挂载
 4. 记录挂载状态
 */
/**
 * createAppAPI返回的createApp函数才是真正创建应用的入口。在createApp里会创建vue应用的上下文，同时初始化app，并绑定应用上下文到app实例上，最后返回app。
 * @param render
 */
export function createAppAPI(render) {
  // 真正创建app的入口
  return function createApp(rootComponent) {
    // 挂载根组件
    const app = {
      _component: rootComponent, // 根组件
      mount(rootContainer) {
        console.log('基于根组件创建 vnode')
        const vnode = createVNode(rootComponent)
        console.log('调用 render，基于 vnode 进行开箱')
        render(vnode, rootContainer)
      }
    }

    return app
  }
}
