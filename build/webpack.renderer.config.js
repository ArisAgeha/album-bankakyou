const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const alias = require('./webpack.alias');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader', options: { modules: true } }],
});

rules.push({
  test: /\.scss$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader", options: { modules: true } }, { loader: "sass-loader" }],
})

module.exports = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias
  },
};
