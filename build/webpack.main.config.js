const alias = require('./commonConfig/webpack.alias');

module.exports = {
    entry: './src/main.ts',
    module: {
        rules: require('./commonConfig/webpack.rules'),
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
        alias
    },
};