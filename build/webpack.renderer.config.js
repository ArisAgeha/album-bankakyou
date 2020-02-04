const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const path = require('path');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
  test: /\.scss$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }, { loader: "sass-loader" }],
})

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      'services': path.resolve(__dirname, '../src/ph/services'),
      '@': path.resolve(__dirname, '../src'),
      'workbench': path.resolve(__dirname, '../src/workbench'),
    }
  },
};
