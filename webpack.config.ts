/* eslint-env node */
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

import path from 'path';

const IS_PROD = process.argv.find(a => a.includes('mode=production')) !== undefined;

const babelPlugins = [
  ['@babel/plugin-proposal-decorators', {legacy: true}],
  ['@babel/plugin-transform-react-display-name'],
  ['@babel/plugin-proposal-export-default-from'],
  ['@babel/plugin-proposal-class-properties'],
  ['@babel/plugin-proposal-optional-chaining'],
  IS_PROD ? null : ['react-hot-loader/babel'],
];

const config: webpack.Configuration = {
  entry: {app: './app/index.tsx'},
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[hash].js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {app: path.resolve(__dirname, 'app')},
    fallback: {
      path: 'path-browserify',
    },
  },
  devtool: IS_PROD ? 'source-map' : 'eval-cheap-module-source-map',
  devServer: {
    port: 9090,
    hot: true,
    https: true,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:8080',
      '/api/events': {target: 'ws://localhost:8080', ws: true},
    },
  },
  optimization: {
    splitChunks: {chunks: 'all'},
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-typescript',
            '@babel/preset-react',
          ],
          plugins: babelPlugins.filter(x => x !== null),
          compact: true,
        },
      },
      {
        test: /\.ne/,
        use: 'nearley-loader',
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
  plugins: [
    new HtmlWebpackPlugin({template: 'app/index.html'}),
    new ForkTsCheckerWebpackPlugin(),
    new webpack.DefinePlugin({
      IS_PROD: JSON.stringify(IS_PROD),
      VERSION: JSON.stringify(process.env.VERSION || 'dev'),
    }),
    ...(IS_PROD ? [] : [new webpack.HotModuleReplacementPlugin()]),
  ],
};

export default config;
