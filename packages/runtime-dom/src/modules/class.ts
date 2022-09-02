/**
 * 更新 class
 * @param el
 * @param value
 */
export function patchClass(el, value) {
  if (value === null) {
    el.removeAttribute('class')
  } else {
    el.className = value
  }
}
