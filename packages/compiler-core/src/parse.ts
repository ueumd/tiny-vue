import { NodeTypes } from './ast'

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

export function parse(template) {
  // 创建上下文
  const context = createParserContext(template)

  const nodes = []

  // < 元素
  // {{}} 表达式
  // 其他是文本
  while (!isEnd(context)) {
    let node
    const source = context.source
    if (source.startsWith('{{')) {
      node = 'xxx'
    } else if (source[0] === '<') {
      node = 'qqq'
    }

    // 文本
    if (!node) {
      node = parseText(context)
      // break
    }

    nodes.push(node)
    console.log(nodes)
    break
  }
}
