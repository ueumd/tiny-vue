import { TextModes } from '@tiny-vue/compiler-core'
import { ParserOptions } from '@tiny-vue/compiler-core'
import { isHTMLTag, isVoidTag, makeMap } from '@tiny-vue/shared'
import { decodeHtml } from './decodeHtml'

const isRawTextContainer = /*#__PURE__*/ makeMap('style,iframe,script,noscript', true)

export const parserOptions: ParserOptions = {
  isVoidTag,
  isNativeTag: tag => isHTMLTag(tag),
  whitespace: 'preserve', //默认节点之间无存在多个空白符
  decodeEntities: decodeHtml,
  getTextMode({ tag }): TextModes {
    if (tag === 'textarea' || tag === 'title') {
      return TextModes.RCDATA
    }

    if (isRawTextContainer(tag)) {
      return TextModes.RAWTEXT
    }
    return TextModes.DATA
  }
}
