const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const alias = require('./webpack.alias');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
  test: /\.scss$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader", options: { modules: { localIdentName: "[local]---[hash:base64:5]" } } }, { loader: "sass-loader" }],
})

module.exports = {
  module: {
    rules,
  },
  devtool: 'source-map',
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias
  },
};
