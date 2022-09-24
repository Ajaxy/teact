const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (_env, { mode = 'production' }) => {
  return {
    mode,
    entry: './demo/index.tsx',
    target: 'web',

    devServer: {
      port: 1234,
      host: '0.0.0.0',
      allowedHosts: 'all',
      hot: false,
      devMiddleware: {
        stats: 'minimal',
      },
    },

    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[id].[chunkhash].js',
      assetModuleFilename: '[name].[contenthash][ext]',
      path: path.resolve(__dirname, '../docs/demo'),
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.(ts|tsx|js)$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
      ],
    },

    resolve: {
      extensions: ['.js', '.ts', '.tsx'],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './demo/index.html',
      }),
    ],

    devtool: 'source-map',
  };
};
