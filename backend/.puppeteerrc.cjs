const { join } = require("path");

// Render only ships the project dir to runtime; the default ~/.cache/puppeteer Chrome download is lost.
module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
