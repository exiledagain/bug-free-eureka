import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const __dirname = import.meta.dirname

const path = require('path')

export default {
  entry: './index.js',
  output: {
    filename: 'pd2propparser.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'ProjectDiablo2PropGrammar',
    libraryTarget: 'commonjs',
    libraryExport: 'default'
  },
  resolve: { fallback: { fs: false, util: require.resolve("util/") } },
  optimization: {
    minimize: true
  }
}
