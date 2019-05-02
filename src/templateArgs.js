module.exports = {
  evaluate: /<%([\s\S]+?)%>/g,
  escape: /<%-([\s\S]+?)%>/g,
  interpolate: /<%=([\s\S]+?)%>/g,
};
