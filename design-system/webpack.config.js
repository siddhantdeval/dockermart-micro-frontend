const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devServer: {
    port: 3005,
    historyApiFallback: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  output: {
    publicPath: 'auto',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'designSystem',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/Button',
        './GlobalStyles': './src/GlobalStyles',
      },
      shared: {
        react: { singleton: true, eager: false, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, eager: false, requiredVersion: '^18.0.0' },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
