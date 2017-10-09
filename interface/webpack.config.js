const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: 'app.js',
  },
  resolve: { alias: { app: path.resolve(__dirname, 'src') } },
  devtool: 'source-map',
  devServer: { port: 9000, hot: true },
  module: {
    loaders: [
      {
        test:   /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query:  { presets: [ 'env', 'stage-1', 'react' ] },
      },
      {
        test: /\.scss$/,
        loaders: [ 'style-loader', 'css-loader', 'sass-loader' ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html' }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
  ],
};
