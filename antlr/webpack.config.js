const path = require('path')

module.exports = {
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
