const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackObfuscator = require('webpack-obfuscator');
const HtmlWebpackInjector = require('html-webpack-injector');

const path = require('path');
const webpack = require('webpack');
module.exports = function(env) {
    //This is to switch URLS
    const envConfig = {};
    switch (env){
        case 'prod':
            envConfig.production = true;
            envConfig.hostname = 'azma.io';
            envConfig.url = 'https://discord.com/api/oauth2/authorize?client_id=734546137830260817&redirect_uri=https%3A%2F%2Fazma.io%2FafterAUTH.html&response_type=code&scope=identify';
        case 'dev':
            envConfig.production = false;
            envConfig.hostname = 'localhost';
            envConfig.url = 'https://discord.com/api/oauth2/authorize?client_id=734546137830260817&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2FafterAUTH.html&response_type=code&scope=identify';
    }
    return {
        devtool: "source-map",
        entry: {
            index_head: './assets/js/main_out.js',
        },
        output: {
            filename: '[name].bundle.[contenthash].js',
            path: path.resolve(__dirname, 'dist'),
            //publicPath: "/dist/"
        },
        watchOptions: {
            poll: 500
        },
        optimization: {
            minimize: true
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env',
                                {
                                    "plugins": [
                                        //I believe this is to allow private class properties (ex, see Cell.js)
                                        "@babel/plugin-proposal-class-properties"
                                    ]

                                }

                            ]
                        }
                    }
                },

                {
                    test: /\.(png|jpg|gif)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'img/',
                            publicPath: ' img/'
                        }
                    },
                },
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        'css-loader',
                    ]
                },

                {
                    test: /\.html$/,
                    use: [
                        'html-loader',
                    ]
                }
                ,

                // {
                //     test: /\.js$/,
                //     exclude: [
                //         path.resolve(__dirname, 'node_modules')
                //     ],
                //     enforce: 'post',
                //     use: {
                //         loader: WebpackObfuscator.loader,
                //         options: {
                //             rotateStringArray: true
                //         }
                //     }
                // }
            ]
        },
        devServer: {
            contentBase: path.join(__dirname, "dist"),
            open: true,

        },
        plugins: [
            new HtmlWebpackPlugin({
                // template: "./index.html",
                template: 'assets/index.html',
                minify: false,
                chunks: ["index_head"]
            }),
            new CleanWebpackPlugin(),
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            }),
            new HtmlWebpackInjector(), //Initialize the plugin
            new WebpackObfuscator({
                rotateStringArray: true
            }),
            new webpack.DefinePlugin({
                'HOSTNAME': JSON.stringify(envConfig.hostname),
                'APIURL': JSON.stringify(envConfig.url),
                'PRODUCTION':JSON.stringify(envConfig.production),
            })
        ]
    }
};

console.log(process.env.NODE_ENV);
