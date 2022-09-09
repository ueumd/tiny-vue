import { CREATE_ELEMENT_VNODE } from './runtimeHelpers'
import { isString } from '@tiny-vue/shared'
export const enum NodeTypes {
  // 根节点
  ROOT,

  // 元素节点
  ELEMENT,

  // 文本
  TEXT,

  // 注释
  COMMENT,

  // 简单表达式
  SIMPLE_EXPRESSION,

  // 模版表达式 {{ name }
  INTERPOLATION,
  ATTRIBUTE,
  DIRECTIVE,

  // containers
  // 复合表达式  {{name}} hello
  COMPOUND_EXPRESSION,
  IF,
  IF_BRANCH,
  FOR,

  // 文本调用
  TEXT_CALL,

  // codegen
  VNODE_CALL, // 元素调用
  JS_CALL_EXPRESSION, // js调用表达式
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT
}

export function createCompoundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children
  }
}

export function createCallExpression(callee, _argments) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: _argments
  }
}

export function createObjectProperty(key, value) {
  return {
    type: NodeTypes.JS_PROPERTY,
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value
  }
}

export function createSimpleExpression(content, isStatic = false) {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content,
    isStatic
  }
}

/**
 * 创建根节点
 * @param children
 */
export function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    helpers: [],
    children
  }
}

/**
 * 生成 codegenNode
 * @param context
 * @param tag
 * @param props
 * @param children
 * @param patchFlag
 * @param dynamicProps
 * @param directives
 * @param isComponent
 */
export function createVNodeCall(
  context = null,
  tag,
  props?,
  children?,
  patchFlag?,
  dynamicProps?,
  directives?,
  isComponent = false
) {
  if (context) {
    context.helper(CREATE_ELEMENT_VNODE)
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isComponent
  }
}
