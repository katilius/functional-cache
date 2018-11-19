const cacheFactory = require("./index");

describe("CacheFactory", () => {
  let originalFunction;

  const TEST_VALUE_1 = "test-value-1";
  const TEST_VALUE_2 = "test-value-2";

  beforeEach(() => {
    originalFunction = jest.fn();
  });

  describe("#cacheCalls", () => {
    it("uses first function parameter as cache key", async () => {
      originalFunction.mockReturnValue(Promise.resolve(453535));
      const cache = cacheFactory.createNew();
      const cachedFn = cache.cacheCalls(originalFunction);

      expect(await cachedFn("key1")).toEqual(453535);
      expect(await cachedFn("key1")).toEqual(453535);

      expect(originalFunction).toHaveBeenCalledTimes(1);
    });

    it("supports custom cache key provider", async () => {
      originalFunction.mockReturnValue(TEST_VALUE_1);
      const cache = cacheFactory.createNew();

      let config = {
        keyGenerator: value => value.toUpperCase()
      };
      const cachedFn = cache.cacheCalls(originalFunction, config);

      expect(await cachedFn("apple")).toEqual(TEST_VALUE_1);
      expect(await cachedFn("APPLE")).toEqual(TEST_VALUE_1);

      expect(originalFunction).toHaveBeenCalledTimes(1);
    });

    it("does not cache if skip condition provided", async () => {
      originalFunction.mockReturnValue(Promise.resolve(TEST_VALUE_1));
      const cache = cacheFactory.createNew();

      let config = {
        skipIf: value => value > 100
      };
      const cachedFn = cache.cacheCalls(originalFunction, config);

      expect(await cachedFn(555)).toEqual(TEST_VALUE_1);
      expect(await cachedFn(555)).toEqual(TEST_VALUE_1);
      expect(await cachedFn(555)).toEqual(TEST_VALUE_1);

      expect(originalFunction).toHaveBeenCalledTimes(3);
    });

    it("cache value, if skip condition is not met", async () => {
      originalFunction.mockReturnValue(Promise.resolve(TEST_VALUE_1));
      const cache = cacheFactory.createNew();

      let config = {
        skipIf: value => value > 100
      };
      const cachedFn = cache.cacheCalls(originalFunction, config);

      expect(await cachedFn(44)).toEqual(TEST_VALUE_1);
      expect(await cachedFn(44)).toEqual(TEST_VALUE_1);
      expect(await cachedFn(44)).toEqual(TEST_VALUE_1);

      expect(originalFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe("#evictOnCall", () => {
    it("removes value from cache, once evict function is called", async () => {
      const evictFunction = jest.fn();
      originalFunction.mockReturnValue(Promise.resolve(453535));

      const cache = cacheFactory.createNew();
      const cachedFn = cache.cacheCalls(originalFunction);
      const wrappedEvictFn = cache.evictOnCall(evictFunction);

      expect(await cachedFn("key1")).toEqual(453535);
      await wrappedEvictFn(wrappedEvictFn("key1"));
      expect(await cachedFn("key1")).toEqual(453535);

      expect(originalFunction).toHaveBeenCalledTimes(2);
    });

    it("supports custom cache key provider", async () => {
      const evictFunction = jest.fn();
      originalFunction.mockReturnValue(Promise.resolve(TEST_VALUE_1));
      let config = {
        keyGenerator: value => value.toUpperCase()
      };
      const cache = cacheFactory.createNew();
      const wrappedEvictFn = cache.evictOnCall(evictFunction, config);
      const cachedFn = cache.cacheCalls(originalFunction);

      expect(await cachedFn("APPLE")).toEqual(TEST_VALUE_1);
      await wrappedEvictFn("apple");
      expect(await cachedFn("APPLE")).toEqual(TEST_VALUE_1);

      expect(originalFunction).toHaveBeenCalledTimes(2);
    });

    it("does not evict if skip condition is met", async () => {
      const evictFunction = jest.fn();
      originalFunction.mockReturnValue(Promise.resolve(TEST_VALUE_1));
      const cache = cacheFactory.createNew();

      let config = {
        skipIf: () => true
      };
      const cachedFn = cache.cacheCalls(originalFunction);
      const wrappedEvictFn = cache.evictOnCall(evictFunction, config);

      expect(await cachedFn(555)).toEqual(TEST_VALUE_1);
      await wrappedEvictFn(555);
      expect(await cachedFn(555)).toEqual(TEST_VALUE_1);

      expect(originalFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe("#addResultToCache", () => {
    it("adds returned value to cache", async () => {
      const updateFieldInDb = jest.fn();
      updateFieldInDb.mockReturnValue(Promise.resolve(TEST_VALUE_2));
      originalFunction.mockReturnValue(Promise.resolve(TEST_VALUE_1));

      const cache = cacheFactory.createNew();
      const cachedFn = cache.cacheCalls(originalFunction);
      const updateField = cache.addResultToCache(updateFieldInDb);

      expect(await cachedFn("key1")).toEqual(TEST_VALUE_1);
      expect(await updateField("key1")).toEqual(TEST_VALUE_2);
      expect(await cachedFn("key1")).toEqual(TEST_VALUE_2);

      expect(originalFunction).toHaveBeenCalledTimes(1);
      expect(updateFieldInDb).toHaveBeenCalledTimes(1);
    });

    it("always calls original function", async () => {
      const updateFieldInDb = jest.fn();
      const cache = cacheFactory.createNew();
      const updateField = cache.addResultToCache(updateFieldInDb);

      await updateField("key1");
      await updateField("key1");
      await updateField("key1");

      expect(updateFieldInDb).toHaveBeenCalledTimes(3);
    });

    it("supports custom cache key provider", async () => {
      const updateFieldInDb = jest.fn();
      updateFieldInDb.mockReturnValue(Promise.resolve(TEST_VALUE_2));
      originalFunction.mockReturnValue(Promise.resolve(TEST_VALUE_1));

      const cache = cacheFactory.createNew();
      const cachedFn = cache.cacheCalls(originalFunction);
      let config = { keyGenerator: arg => arg.toLowerCase() };
      const updateField = cache.addResultToCache(updateFieldInDb, config);

      expect(await cachedFn("key1")).toEqual(TEST_VALUE_1);
      expect(await updateField("KEY1")).toEqual(TEST_VALUE_2);
      expect(await cachedFn("key1")).toEqual(TEST_VALUE_2);
    });

    it("does not add value to cache if skip condition is met", async () => {
      const updateFieldInDb = jest.fn();
      updateFieldInDb.mockReturnValue(Promise.resolve(TEST_VALUE_2));
      originalFunction.mockReturnValue(Promise.resolve(TEST_VALUE_1));

      const cache = cacheFactory.createNew();
      const cachedFn = cache.cacheCalls(originalFunction);
      let config = { skipIf: () => true };
      const updateField = cache.addResultToCache(updateFieldInDb, config);

      expect(await cachedFn("key1")).toEqual(TEST_VALUE_1);
      expect(await updateField("key1")).toEqual(TEST_VALUE_2);
      expect(await cachedFn("key1")).toEqual(TEST_VALUE_1);
    });
  });
});
