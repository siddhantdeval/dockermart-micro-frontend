const prefixer = require('postcss-prefix-selector');

module.exports = {
  plugins: [
    prefixer({
      prefix: '.catalog-app',
      transform(prefix, selector, prefixedSelector, filePath) {
        // Avoid double prefixing or prefixing global html/body selectors directly in a way that breaks
        if (selector === 'html' || selector === 'body') {
          return prefix;
        }
        return prefixedSelector;
      }
    })
  ]
};
