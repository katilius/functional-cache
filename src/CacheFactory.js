const InMemoryCacheProvider = require("./providers/InMemoryCacheProvider");
const keyGenerators = require("./keyGenerators");
const defaultConfig = {
  keyGenerator: keyGenerators.pickFirstArgument,
  skipIf: () => false
};

function mergeWithDefaultConfig(config) {
  return {
    ...defaultConfig,
    ...config
  };
}
module.exports = class CacheFactory {
  constructor(cacheProvider) {
    this.cache = cacheProvider || new InMemoryCacheProvider();
  }

  cacheCalls(fn, config) {
    const fullConfig = mergeWithDefaultConfig(config);
    return async function(...args) {
      if (fullConfig.skipIf(...args)) {
        return fn(...args);
      }
      const key = fullConfig.keyGenerator(...args);
      const value = await this.cache.get(key);
      if (value !== undefined) {
        return value;
      } else {
        const value = await fn(...args);
        await this.cache.set(key, value);
        return value;
      }
    }.bind(this);
  }

  evictOnCall(fn, config) {
    const fullConfig = mergeWithDefaultConfig(config);
    return async function(...args) {
      if (fullConfig.skipIf(...args)) {
        return fn(...args);
      }
      let key = fullConfig.keyGenerator(...args);
      await this.cache.remove(key);
      return fn(...args);
    }.bind(this);
  }

  addResultToCache(fn, config) {
    const fullConfig = mergeWithDefaultConfig(config);
    return async function(...args) {
      if (fullConfig.skipIf(...args)) {
        return await fn(...args);
      }
      let key = fullConfig.keyGenerator(...args);
      const result = await fn(...args);
      await this.cache.set(key, result);
      return result;
    }.bind(this);
  }
};
