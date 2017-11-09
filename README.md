# awareness

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]


## Overview

- Easily create rich actions
- Use generator functions for animation
- Use async functions
- Transform existing state just like React’s functional `setState((prevState) => newState)`


## Libraries

- [React library](https://github.com/RoyalIcing/react-organism)
- [Preact library](https://github.com/RoyalIcing/preact-organism)
- [Redux library](https://github.com/RoyalIcing/redux-organism)


## Handler types

### Function returning new state

```js
const changeCarrots = () => ({
  carrots: 25
})
```

### Function returning function that transforms old state to new state

```js
const addCarrots = () => ({ carrots }) => ({
  carrots: carrots + 10
})
```

### Async function returning new state

```js
const changeCarrotsInFuture = async () => {
  const res = await fetch('/api/carrots')
  const data = res.json()
  return { carrots: data.carrots }
}
```

Or with `Promise`:

```js
const changeCarrotsInFuture = () => {
  return fetch('/api/carrots')
    .then(res => res.json())
    .then(data => ({ carrots: data.carrots }))
  })
}
```

### Generator function yielding new state

```js
// Will update state on each frame: 0, 1, 2, 3, 4, 5
function * animateCarrotsZeroToFive() {
  yield { carrots: 0 }
  yield { carrots: 1 }
  yield { carrots: 2 }
  yield { carrots: 3 }
  yield { carrots: 4 }
  yield { carrots: 5 }
}
```

### Generator function yielding function that transforms old state to new state

```js
// Will update state for 10 frames: carrots+1, carrots+2, … carrots+9, carrots+10
function * animateCarrotsByTen() {
  let total = 10
  while (total > 0) {
    yield ({ carrots }) => { carrots: carrots + 1 }
    total -= 1
  }
}
```

### Generator function yielding Promise resolving to new state

```js
// Will use result of fetching `url` and store it in state
function * loadURL(url) {
  yield { loading: true }
  yield fetch(url).then(res => res.json())
  yield { loading: false }
}
```


[build-badge]: https://img.shields.io/travis/user/repo/master.png?style=flat-square
[build]: https://travis-ci.org/user/repo

[npm-badge]: https://img.shields.io/npm/v/npm-package.png?style=flat-square
[npm]: https://www.npmjs.org/package/npm-package

[coveralls-badge]: https://img.shields.io/coveralls/user/repo/master.png?style=flat-square
[coveralls]: https://coveralls.io/github/user/repo
