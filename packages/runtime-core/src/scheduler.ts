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
      const jobList = queue.slice(0)
      for (let i = 0; i < jobList.length; i++) {
        const job = jobList[i]
        job()
      }

      queue.length = 0
      jobList.length = 0
    })
  }
}
