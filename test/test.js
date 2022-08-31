var reactiveMap = new WeakMap()
var shallowReactiveMap = new WeakMap()
var readonlyMap = new WeakMap()
var shallowReadonlyMap = new WeakMap()
function isReadonly(value) {
  return !!value['__v_isReadonly' /* ReactiveFlags.IS_READONLY */]
  // return !!(value && (value as Target)[ReactiveFlags.IS_SHALLOW])
}
console.log(isReadonly('hello'))
