const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const IS_PROD =
  process.argv.find(a => a.includes('mode=production')) !== undefined;

const plugins = [
  new HtmlWebpackPlugin({
    template: 'app/index.html',
  }),
  new webpack.DefinePlugin({
    IS_PROD,
    VERSION: JSON.stringify(process.env.VERSION || 'dev'),
  }),
  IS_PROD ? null : new webpack.HotModuleReplacementPlugin(),
];

const babelPlugins = [
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  ['@babel/plugin-transform-react-display-name'],
  ['@babel/plugin-proposal-export-default-from'],
  ['@babel/plugin-proposal-class-properties'],
  IS_PROD ? null : ['react-hot-loader/babel'],
];

module.exports = {
  entry: { app: './app/index.js' },
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: '[name].[hash].js',
  },
  resolve: {
    alias: { app: path.resolve(__dirname, 'app') },
  },
  devtool: IS_PROD ? 'source-map' : 'cheap-module-eval-source-map',
  devServer: { port: 9000, hot: true },
  optimization: {
    splitChunks: { chunks: 'all' },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', { targets: { chrome: '64' } }],
            ['@babel/preset-react'],
          ],
          plugins: babelPlugins.filter(x => x !== null),
          compact: true,
        },
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/,
        use: 'file-loader',
      },
    ],
  },
  plugins: plugins.filter(x => x !== null),
};
