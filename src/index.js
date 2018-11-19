const CacheFactory = require("./CacheFactory");
const keyGenerators = require("./keyGenerators");
const InMemoryCacheProvider = require("./providers/InMemoryCacheProvider");

module.exports = {
  createNew: (...args) => new CacheFactory(...args),
  keyGenerators,
  InMemoryCacheProvider
};
