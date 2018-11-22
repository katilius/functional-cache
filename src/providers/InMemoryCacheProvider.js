const LRU = require('lru-cache');
module.exports = class InMemoryCacheProvider {
  constructor(options) {
    this.cache = LRU(options);
  }
  async set(key, value) {
    this.cache.set(key, value);
  }

  async get(key) {
    return this.cache.get(key);
  }

  async remove(key) {
    this.cache.del(key);
  }

  async removeAll() {
    this.cache.reset();
  }
};
