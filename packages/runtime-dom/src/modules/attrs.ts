/**
 * 更新属性
 * @param el
 * @param key
 * @param value
 */
export function patchAttr(el, key, value) {
  if (value === null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
