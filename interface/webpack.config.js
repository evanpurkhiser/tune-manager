const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: 'app.js',
  },
  devtool: 'source-map',
  devServer: { port: 9000 },
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
  plugins: [ new HtmlWebpackPlugin({ template: 'src/index.html' }) ],
};
