# Functional Cache

Collection of helper functions that help you cache long running functions. Main goal of this library is to separate concerns between caching and business logic. It is inspired by functional programming memoization pattern, which let's you simply wrap function and optimize performance.

For example, you most probably written similar code:

```javascript
const cache = new SomeCache();

function getBooks(type) {
  const cachedValue = cache.getValue(type);
  if (cachedValue) {
    return Promise.resolve(cachedValue);
  } else {
    return getBooksFromApi(type);
  }
}
```

With this library you can simply write:

```javascript
const cache = new CacheFactory("books-cache");
const getBooks = cache.cacheCalls(getBooksFromApi);
```

Aim of this library is to keep original source code the same and encourage extracting all cache related logic to separate functions. With this in mind, these are more advanced features, that are supported:

- Cache eviction (with conditional eviction)
- Custom cache key selection (built in helpers provided)
- Conditional caching

## Cache creation

```javascript
new CacheFactory();
```

By default it will use in-memory cache with 1 minute TTL. This easily configured with second parameter, which takes instance of `CacheProvider`. Cache provider has the following interface:

- `set(key, value)`
- `get(key)`
- `remove(key)`
- `removeAll()`

`CacheFactory` on purpose does not have global configuration for TTL, namespacing and other details. They should be configured in cache provider. For example: `new CacheFactory(new MyInMemoryCacheProvider({ttlSeconds: 60}))`

## Cache functions

### `cacheCall(function, options)`

Supported options:
- `keyProvider` - by default first argument of call is used, this lets customize key generation. It gets all original function arguments and has to result in cache key.
- `skipIf` - used for conditional caching, takes all original function arguments and returns boolean value if value should be skipped from cache.

### `evictOnCall(function, options)`

Removes value from cache on call based on cache key.

```javascript
const cache = new CacheFactory("books-cache");
const getFavoriteBooks = cache.cacheCall(getBooksFromApi);
const addToFavorites = cache.evictOnCall(addToFavoritesUsingApi);
```

Then:

```javascript
// call API and write to cache
getFavoriteBooks("scifi");
// get from cache
getFavoriteBooks("scifi");
// removed from cache
addToFavorites("scifi", "Hitchhiker's Guide Through the Galaxy");
// call API again and write to cache
addToFavorites("scifi", "Hitchhiker's Guide Through the Galaxy");
```

### `addResultToCache(fn, options)`

Similar to `cacheCall`, but it never interferes with function execution, it just takes result of the function and puts into cache.

```javascript
const cache = new CacheFactory("user-details");
const getUserDetails = cache.cacheCall(getUserFromDb);
const updateUserDetails = cache.addResultToCache(updateUserInDb);
``` 