const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackObfuscator = require('webpack-obfuscator');
const HtmlWebpackInjector = require('html-webpack-injector');

const path = require('path');
const webpack = require('webpack');

module.exports = {
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
        minimize: false
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
        new HtmlWebpackInjector() //Initialize the plugin
    ],
};