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
      let value;
      try {
        value = await this.cache.get(key);
      } catch (e) {
        // TODO add logging
        return await fn(...args);
      }
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
      try {
        await this.cache.remove(key);
      } catch (e) {
        // TODO add logging
      }
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
      try {
        await this.cache.set(key, result);
      } catch (e) {
        // TODO add logging
      }
      return result;
    }.bind(this);
  }
};
