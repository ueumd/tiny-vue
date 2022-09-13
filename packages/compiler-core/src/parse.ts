import { NodeTypes } from './ast'

//状态机的模式，根据这些模式来决定解析标签的具体规则
export const enum TextModes {
  //          | 是否解析标签 | 是否支持解析HTML实体
  DATA, //    |    ✔        |     ✔
  RCDATA, //  |    ✘        |     ✔
  RAWTEXT, // |    ✘        |     ✘
  CDATA, // |    ✘        |     ✘
  ATTRIBUTE_VALUE
}

function createParserContext(template) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: template, // 解析此字段
    originalSource: template
  }
}

function isEnd(context) {
  const source = context.source

  // <div></div> 没有子节点时
  if (context.source.startsWith('</')) {
    return true
  }

  // 解析完毕后为空字符串， 表示解析完毕
  return !source
}

function getCursor(context) {
  const { line, column, offset } = context

  return { line, column, offset }
}

function advancePositionWithMutation(context, source, endIndex) {
  let linesCount = 0

  // 记录换行
  let linePos = -1
  for (let i = 0; i < endIndex; i++) {
    // 回车
    if (source.charCodeAt(i) === 10) {
      linesCount++
      linePos = i
    }
  }

  context.line += linesCount
  context.offset += endIndex
  context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
}

function advanceBy(context, endIndex) {
  const source = context.source

  // 更新 行 列 偏移量
  advancePositionWithMutation(context, source, endIndex)

  // 截取掉
  context.source = source.slice(endIndex)
}

function parseTextData(context, endIndex) {
  // 截取文字 'abc <a></a> {{name}}'  abc
  const rawText = context.source.slice(0, endIndex)

  advanceBy(context, endIndex)

  return rawText
}

function getSelection(context, start, end?) {
  end = end || getCursor(context)
  return {
    end,
    start,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}

function parseText(context) {
  const endTokens = ['<', '{{']

  let endIndex = context.source.length

  // as {{name<h1
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  // 行 列 信息
  const start = getCursor(context)

  // 取内容
  const content = parseTextData(context, endIndex)

  console.log(endIndex)

  return {
    type: NodeTypes.TEXT,
    content: content,
    loc: getSelection(context, start)
  }
}

function parseInterpolation(context) {
  const start = getCursor(context)

  // {{ }}
  const closeIndex = context.source.indexOf('}}', 2)

  advanceBy(context, 2)

  const innerStart = getCursor(context)
  const innerEnd = getCursor(context)

  // 原始内容
  const rawContentLength = closeIndex - 2
  const preContent = parseTextData(context, rawContentLength)
  const content = preContent.trim()

  const startOffset = preContent.indexOf(content)
  if (startOffset > 0) {
    advancePositionWithMutation(innerStart, preContent, startOffset)
  }

  const endOffset = startOffset + content.length

  advancePositionWithMutation(innerEnd, preContent, endOffset)

  advanceBy(context, 2)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  }
}

// 匹配空格
function advanceBySpaces(context) {
  const match = /^[ \t\r\n]+/.exec(context.source)
  if (match) {
    // 匹配后删除空格
    advanceBy(context, match[0].length)
  }
}

function parseAttributeValue(context) {
  const start = getCursor(context)

  // 取 " || ‘
  const quote = context.source[0]

  let content

  if (quote === '"' || quote === "'") {
    advanceBy(context, 1) // "val"
    const endIndex = context.source.indexOf(quote)
    content = parseTextData(context, endIndex)
    advanceBy(context, 1)
  }

  return {
    content,
    loc: getSelection(context, start)
  }
}

function parseAttribute(context) {
  const start = getCursor(context)
  // 属性的名字
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)

  // key的名子
  const name = match[0]
  advanceBy(context, name.length)

  advanceBySpaces(context) // id = 1

  advanceBy(context, 1)

  // id = ''  id=""
  const value = parseAttributeValue(context)

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: {
      type: NodeTypes.TEXT,
      ...value
    },
    loc: getSelection(context, start)
  }
}

// 属性
function parseAttributes(context) {
  const props = []
  // <div id='1'>hello</div>
  while (context.source.length > 0 && !context.source.startsWith('>')) {
    const prop = parseAttribute(context)
    props.push(prop)

    // 去空格
    advanceBySpaces(context)
  }
  return props
}

function parseTag(context) {
  const start = getCursor(context)

  // 解析标签
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)

  /**
   * `<div>123</div>`
   *
   * ['<div', 'div', index: 0, input: '<div>123</div>', groups: undefined]
   *  console.log(match)
   */

  const tag = match[1]

  advanceBy(context, match[0].length)

  // 处理空格 \t \r等
  advanceBySpaces(context)

  // 处理属性
  const props = parseAttributes(context)

  const isSelfClosing = context.source.startsWith('/>')

  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
    isSelfClosing,
    children: [],
    props,
    loc: getSelection(context, start)
  }
}

function parseElement(context) {
  // </div>
  const ele = parseTag(context)

  // 子节点
  // 递归
  const children = parseChildren(context)

  // <div></div>
  if (context.source.startsWith('</')) {
    parseTag(context)
  }

  ele.loc = getSelection(context, ele.loc.start)

  // 挂载子节点
  ele.children = children
  return ele
}

export function baseParse(template) {
  // 创建上下文
  const context = createParserContext(template)

  const start = getCursor(context)
  return createRoot(parseChildren(context), getSelection(context, start))

  // return parseChildren(context)
}

function createRoot(children, loc) {
  return {
    type: NodeTypes.ROOT, // Fragment
    children,
    loc,
    helpers: []
  }
}

// 子节点
function parseChildren(context) {
  const nodes = []

  // < 元素
  // {{}} 表达式
  // 其他是文本
  while (!isEnd(context)) {
    let node
    const source = context.source
    if (source.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (source[0] === '<') {
      node = parseElement(context)
    }

    // 文本
    if (!node) {
      node = parseText(context)
      // break
    }

    nodes.push(node)
    // console.log(nodes)
    // break
  }

  // return nodes

  /**
   * fragment
   * <div>hello</div>  </div>后有空多个空格
   */
  nodes.forEach((node, i) => {
    if (node.type === NodeTypes.TEXT) {
      // 不是文本内容
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        // 清空
        nodes[i] = null
      }
    }
  })

  // 把为null的过滤掉
  return nodes.filter(Boolean)
}
