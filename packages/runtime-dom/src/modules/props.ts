import { includeBooleanAttr } from '@vue/shared'

export function patchDOMProp(el, key, value) {
  const type = typeof el[key]
  console.log('prop', key)
  if (value === '' || value === null) {
    if (type === 'boolean') {
      /**
       * <button disabled></button>
       * <button disabled=""></button>
       * <button :disabled="true"></button>
       * <button :disabled="false"></button>
       *
       * value是null、或者是'' 则默认为true 否则 为false
       */
      el[key] = includeBooleanAttr(value)
      return
    } else if (type === 'string' && value === null) {
      /**
       * <div :id="null" />
       * <div :id="" />
       */
      el[key] = ''
      el.removeAttribute(key)
      return
    } else if (type === 'number') {
      // 某些属性的值必须大于0  eg:input.size = 0 ->input的 size是不允许为0的，try catch来屏蔽报错
      try {
        el[key] = 0
      } catch {}

      el.removeAttribute(key)
      return
    }
  }

  // 有些 props 设置会报错
  // some properties perform value validation and throw,
  // some properties has getter, no setter, will error in 'use strict'
  // e.g. <select :type="null"></select> <select :willValidate="null"></select>
  try {
    el[key] = value
  } catch (e) {
    console.warn(e)
  }
}
