export const mutableHandlers = {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)

    return res
  },
  set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver)
    return result
  }
}