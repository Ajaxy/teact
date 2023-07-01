const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/teact/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'teact.js',
    libraryTarget: 'umd2',
    library: 'teact',
    globalObject: 'this',
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './docs/benchmark/index.html',
    }),
  ],
  devtool: 'source-map',
  devServer: {
    port: 1234,
    host: '0.0.0.0',
    allowedHosts: 'all',
    hot: false,
    devMiddleware: {
      stats: 'minimal',
    },
  },
};
