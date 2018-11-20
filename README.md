# Functional Cache [![Build Status](https://travis-ci.org/katilius/functional-cache.svg?branch=master)](https://travis-ci.org/katilius/functional-cache) [![Coverage Status](https://coveralls.io/repos/github/katilius/functional-cache/badge.svg?branch=master)](https://coveralls.io/github/katilius/functional-cache?branch=master) [![npm version](https://badge.fury.io/js/functional-cache.svg)](https://badge.fury.io/js/functional-cache)


Collection of helper functions that help you cache long running functions. Main goal of this library is to separate concerns between caching and business logic. It is inspired by functional programming memoization pattern, which let's you simply wrap function and optimize performance.

For example, you most probably written similar code:

```javascript
const cache = new SomeCache();

function getBooks(type) {
  const cachedValue = cache.getValue(type);
  if (cachedValue) {
    return Promise.resolve(cachedValue);
  } else {
    return getBooksFromApi(type);cacheCalls
  }
}
```

With this library you can simply write:

```javascript
const cacheFactory = require("functional-cache"); 
const cache = cacheFactory.createNew();
const getBooks = cache.cacheCalls(getBooksFromApi);
```

Aim of this library is to keep original source code the same and encourage extracting all cache related logic to separate functions. With this in mind, these are more advanced features, that are supported:

## Features
- Cache eviction (with conditional eviction)
- Custom cache key selection (built in helpers provided)
- Conditional caching

**Important**

All wrapped functions should return promise/be async. 
## Cache creation

```javascript
cache.createNew();
```

By default it will use in-memory cache with 1 minute TTL. This easily configured with second parameter, which takes instance of `CacheProvider`. Cache provider has the following interface:

- `set(key, value)`
- `get(key)`
- `remove(key)`
- `removeAll()`

`CacheFactory` on purpose does not have global configuration for TTL, namespacing and other details. They should be configured in cache provider. For example: `new CacheFactory(new MyInMemoryCacheProvider({ttlSeconds: 60}))`

## Cache functions

### `cacheCalls(function, options)`

Supported options:
- `keyGenerator` - by default first argument of call is used, this lets customize key generation. It gets all original function arguments and has to result in cache key.
- `skipIf` - used for conditional caching, takes all original function arguments and returns boolean value if value should be skipped from cache.

### `evictOnCall(function, options)`

Removes value from cache on call based on cache key.

```javascript
const cache = cacheFactory.createNew();
const getFavoriteBooks = cache.cacheCalls(getBooksFromApi);
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

Similar to `cacheCalls`, but it never interferes with function execution, it just takes result of the function and puts into cache.

```javascript
const cache = cacheFactory.createNew();
const getUserDetails = cache.cacheCalls(getUserFromDb);
const updateUserDetails = cache.addResultToCache(updateUserInDb);
``` 

## Advanced usage

### Customizing cache providers

`cacheFactory.createNew` function as first argument takes cache provider. By default it uses lru cache with default settings.
You set any cache provider there, as long as it's adheres to defined interfaces.

If you want to use same LRU cache, but with different settings, you can do it this way:

```javascript
const cacheFactory = require("functional-cache"); 
const {InMemoryCacheProvider} = require("functional-cache"); 
const cache = cacheFactory.createNew(new InMemoryCacheProvider({maxAge: 1000 * 60 * 60}));
```

First parameter of `InMemoryCacheProvider` is `options`. Guide to available options is in original wrapped library [lru cache](https://www.npmjs.com/package/lru-cache) 

### Key generators

Functional cache can wrap function with any amount of arguments.
By default it uses first argument to pass along to cache key. However not always it can be used as a cache key. For this `cacheCalls`, `evictOnCall` and `addResultCache` functions has option `keyGenerator` it allows customizing cache key.

You can use one of predefined key generators like this:

```javascript
const cacheFactory = require("functional-cache"); 
const {keyGenerators} = require("functional-cache"); 

// pick argument with index '1'
const options = { keyGenerator: keyGenerators.pickNthArgument(1) };
const getUserBooks = cache.cacheCalls(getUserBooksFromApi, options);

// user id will be used as a cache key
getUserBooks("some value", userId)
```

Key generator is just a function that gets all parameters from original call, so custom generator can be used:

```javascript
const cacheFactory = require("functional-cache"); 

const pickUserName = (date, user) => user.username.toLowerCase();
const options = { keyGenerator: pickUserName };
const getUserBooks = cache.cacheCalls(getUserBooksFromApi, options);

// username converted to lower case will be used as a cache key
getUserBooks("some value", user)
```

### Conditional caching/eviction

You might need to not cache certain values and use value directly from cache based on function arguments. Option `skipIf` allows that. Same as `keyGenerator` it gets all original call arguments. If returned value is true, then caching logic is skipped. For example:

```javascript
const cacheFactory = require("functional-cache"); 

const options = { skipIf: (category, user) => user.role === 'ADMIN' };
const getFavoriteBooks = cache.cacheCalls(getFromApi, options);

// if user is admin, it will always get values from API
getUserBooks("sci-fi", user)

```