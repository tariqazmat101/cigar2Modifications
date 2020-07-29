const {CleanWebpackPlugin}= require('clean-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');
const webpack = require('webpack');

module.exports = {
    devtool: "source-map",
    entry: './assets/js/main_out.js',
    output: {
        filename: '[name].bundle.[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        //publicPath: "/dist/"
    },
    optimization: {
        minimize: false
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env',
                            {
                                "plugins":[
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
        ]
    },
    devServer: {
        contentBase: path.join(__dirname,"dist"),
        open: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            // template: "./index.html",
            template: 'assets/index.html',
            minify: false,
        }),
        new CleanWebpackPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
    ],
};