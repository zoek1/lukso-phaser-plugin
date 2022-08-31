const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map',
  resolve: {
    //"fallback": { 
      //"assert": require.resolve("assert/"),
      //"stream": require.resolve("stream-browserify"),
      //"url": require.resolve("url/"),
      //"https": require.resolve("https-browserify"),
      //"crypto": require.resolve("crypto-browserify"),
      //"http": require.resolve("stream-http"),
    //}
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8000,
  },
  module: {
    rules: [
    ]
  }
}
