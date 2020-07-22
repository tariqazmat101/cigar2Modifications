const {CleanWebpackPlugin}= require('clean-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');

module.exports = {
    entry: './assets/js/main_out.js',
    output: {
        filename: '[name].bundle.[contenthash].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },

            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader'
                    },
                ],
            },
        ]
    },
    devServer: {
        contentBase: './dist',
        open: true
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: "Plug In master",
        }),
        new CleanWebpackPlugin(),
    ],
};