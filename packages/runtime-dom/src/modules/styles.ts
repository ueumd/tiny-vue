export function patchStyle(el: Element, prev, next) {
  const style = (el as HTMLElement).style

  for (const key in next) {
    style[key] = next[key]
  }

  if (prev) {
    for (const key in prev) {
      if (next[key] === null) {
        style[key] = null
      }
    }
  }
}
