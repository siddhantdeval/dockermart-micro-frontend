const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devServer: {
    port: 3000,
    historyApiFallback: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  output: {
    publicPath: '/',
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
      name: 'shell',
      remotes: {
        catalogApp: 'catalogApp@http://localhost:3001/remoteEntry.js',
        cartApp: 'cartApp@http://localhost:3002/remoteEntry.js',
        checkoutApp: 'checkoutApp@http://localhost:3003/remoteEntry.js',
        accountApp: 'accountApp@http://localhost:3004/remoteEntry.js',
        designSystem: 'designSystem@http://localhost:3005/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, eager: false, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, eager: false, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, eager: false, requiredVersion: '^6.14.2' },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
