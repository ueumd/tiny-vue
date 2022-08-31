const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  IS_SHALLOW = '__v_isShallow',
  RAW = '__v_raw'
}

interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}

const reactiveMap = new WeakMap<Target, any>()
const shallowReactiveMap = new WeakMap<Target, any>()
const readonlyMap = new WeakMap<Target, any>()
const shallowReadonlyMap = new WeakMap<Target, any>()

function isReadonly(value: unknown): boolean {
  return !!value[ReactiveFlags.IS_READONLY]
  // return !!(value && (value as Target)[ReactiveFlags.IS_SHALLOW])
}

console.log(isReadonly('hello'))
