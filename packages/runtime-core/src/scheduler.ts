const queue = []
const resolvedPromise = Promise.resolve()
let isFlushing = false

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  if (!isFlushing) {
    isFlushing = true
    // 批处理
    resolvedPromise.then(() => {
      isFlushing = false

      // 先拷贝 后清空
      const jobList = queue.slice(0)
      queue.length = 0
      for (let i = 0; i < jobList.length; i++) {
        const job = jobList[i]
        job()
      }
      jobList.length = 0
    })
  }
}
