export function getSequence(arr) {
  const len = arr.length
  const result = [0] // 以默认第0个为基准来做序列
  const p = new Array(len).fill(0)
  let start
  let end
  let middle
  let resultLastIndex
  for (let i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {
        result.push(i)
        p[i] = resultLastIndex
        continue
      }

      // 递增序列 采用二分查找 是最快的
      start = 0
      end = result.length - 1
      while (start < end) {
        middle = ((start + end) / 2) | 0
        // 1 2 3 4 middle 6 7 8 9   6
        if (arr[result[middle]] < arrI) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      if (arr[result[end]] > arrI) {
        result[end] = i
        p[i] = result[end - 1]
      }
    }
  }
  // 1 默认追加
  // 2 替换
  // 3 记录每项的前驱节点
  // 通过最后一项进行回溯
  let i = result.length
  let last = result[i - 1]
  while (i-- > 0) {
    // 倒叙追溯
    result[i] = last
    last = p[last]
  }
  return result
}
