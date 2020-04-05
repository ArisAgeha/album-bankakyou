const path = require('path');
const rules = require('./commonConfig/webpack.rules');
const plugins = require('./commonConfig/webpack.plugins');
const alias = require('./commonConfig/webpack.alias');

module.exports = {
    module: {
        rules: [
            ...rules,
            {
                test: /\.css$/,
                use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
            },
            {
                test: /\.scss$/,
                use: [
                    { loader: "style-loader" },
                    { loader: "css-loader", options: { modules: { localIdentName: "[local]---[hash:base64:5]" } } },
                    { loader: "sass-loader" },
                    {
                        loader: 'sass-resources-loader',
                        options: {
                            // Provide path to the file with resources
                            resources: [path.resolve(__dirname, '../src/renderer/themes/variable.scss')],
                        },
                    }
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[path][name].[ext]",
                            publicPath: "..", 
                            context: "src"
                        },
                    }
                ]
            }
            // {
            //     test: /\.worker\.js$/,
            //     use: { loader: 'worker-loader' }
            // }
        ]
    },
    devtool: 'source-map',
    plugins,
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        alias
    },
};
