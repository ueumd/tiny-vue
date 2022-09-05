const { build } = require('esbuild')
const { resolve } = require('path')

// minimist 解析命令行参数
// node scripts/dev.js reactivity -f global
// { _: [ 'reactivity' ], f: 'global' }
const args = require('minimist')(process.argv.slice(2))

const target = args._[0] || 'runtime-core'
const format = args.f || 'esm-bundler'

// 开发环境只打包某一个
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

// 输出的格式
// iife 立即执行函数  (function(){})()
// cjs  module.exports
// esm  import
const outputFormat = format.startsWith('global') ? 'iife' : format === 'cjs' ? 'cjs' : 'esm'

// 输出文件
const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true, // 把所有的包全部打包到一起
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions?.name, // 打包的全局的名字
  platform: format === 'cjs' ? 'node' : 'browser', // 平台
  watch: {
    // 监控文件变化
    onRebuild(error) {
      if (!error) console.log(`rebuilt~~~~`)
    }
  }
}).then(() => {
  console.log('watching~~~')
})
