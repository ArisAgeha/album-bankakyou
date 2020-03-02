module.exports = [
    // Add support for native node modules
    {
        test: /\.node$/,
        use: "node-loader"
    },
    {
        test: /\.(m?js|node)$/,
        parser: { amd: false },
        use: {
            loader: "@marshallofsound/webpack-asset-relocator-loader",
            options: {
                outputAssetBase: "native_modules"
            }
        }
    },
    {
        test: /\.tsx?$/,
        exclude: /(node_modules|.webpack)/,
        loaders: [
            {
                loader: "ts-loader",
                options: {
                    transpileOnly: true
                }
            }
        ]
    },
    {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
            loader: "babel-loader",
            query: {
                plugins: [
                    "babel-plugin-transform-typescript-metadata",
                    ["@babel/plugin-proposal-decorators", { "legacy": true }],
                    ["@babel/plugin-proposal-class-properties", { "loose": true }],
                    ["import", {
                        "libraryName": "antd",
                        "libraryDirectory": "es",
                        "style": "css" // `style: true` 会加载 less 文件
                    }]
                ]
            }
        }
    }
];
