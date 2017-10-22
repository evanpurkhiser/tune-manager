const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const commonChunk = new webpack.optimize.CommonsChunkPlugin({
  name: 'vendor',
  minChunks: module => /node_modules/.test(module.resource),
});

module.exports = {
  entry:  { app: './src/index.js' },
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: '[name].js',
  },
  resolve: { alias: { app: path.resolve(__dirname, 'src') } },
  devtool: 'source-map',
  devServer: { port: 9000, hot: true },
  module: {
    loaders: [
      {
        test:    /\.js$/,
        exclude: /node_modules/,
        loader:  'babel-loader',
        query:   { presets: [ 'env', 'stage-1', 'react' ] },
      },
      {
        test:    /\.scss$/,
        loaders: [ 'style-loader', 'css-loader', 'sass-loader' ],
      },
      {
        test:   /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/,
        loader: 'file-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html' }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    commonChunk,
    new webpack.optimize.CommonsChunkPlugin({ name: 'bundle', minChunks: Infinity }),
  ],
};
