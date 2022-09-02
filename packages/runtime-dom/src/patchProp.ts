// dom属性的操作api

import { patchAttr } from './modules/attrs'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/event'
import { patchStyle } from './modules/styles'

// null , 值
// 值   值
// 值   null
export function patchProp(el, key, prevValue, nextValue) {
  // 类名  el.className
  if (key === 'class') {
    patchClass(el, nextValue)
    // el  style {color:'red',fontSzie:'12'}  {color:'blue',background:"red"}
  } else if (key === 'style') {
    // 样式  el.style
    patchStyle(el, prevValue, nextValue)
  } else if (/^on[^a-z]/.test(key)) {
    // events  addEventListener
    patchEvent(el, key, nextValue)
  } else {
    // 普通属性 // el.setAttribute
    patchAttr(el, key, nextValue)
  }
}

// for(let key in obj){
//     patchProp(el,key,null,obj[key])
// }
