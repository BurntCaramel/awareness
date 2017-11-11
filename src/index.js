const nextFrame = () => new Promise((resolve) => {
  window.requestAnimationFrame(resolve)
})

function stateChangerCatchingError(stateChanger, errorKey) {
  return (prevState, props) => {
    // Check if stateChanger is a function
    if (typeof(stateChanger) === typeof(stateChanger.call)) {
      try {
        // Call state changer
        return stateChanger(prevState, props)
      }
      // State changer may throw
      catch (error) {
        // Store error in state
        return { [errorKey]: error }
      }
    }
    // Else just an object with changes
    else {
      return stateChanger
    }
  }
}

function processStateChanger(changeState, stateChanger, storeError) {
  if (!stateChanger) {
    return;
  }

  // Check if thenable (i.e. a Promise)
  if (typeof stateChanger.then === typeof Object.assign) {
    return stateChanger.then(stateChanger => (
      stateChanger && changeState(stateChanger)
    ))
    .catch(storeError)
  }
  // Check if iterator
  else if (typeof stateChanger.next === typeof Object.assign) {
    return processIterator(changeState, stateChanger, storeError)
  }
  // Otherwise, change state immediately
  // Required for things like <textarea> onChange to keep cursor in correct position
  else {
    changeState(stateChanger)
  }
}

function processIterator(changeState, iterator, storeError, previousValue) {
  return Promise.resolve(processStateChanger(changeState, previousValue, storeError)) // Process the previous changer
  .then(() => nextFrame()) // Wait for next frame
  .then(() => {
    const result = iterator.next() // Get the next step from the iterator
    if (result.done) { // No more iterations remaining
      return processStateChanger(changeState, result.value, storeError) // Process the changer
    }
    else {
      return processIterator(changeState, iterator, storeError, result.value) // Process the iterator’s following steps
    }
  })
}

export function callHandler(handler, errorKey, args, alterState) {
  const storeError = (error) => {
    alterState(() => ({ [errorKey]: error }))
  }
  // Call handler function, props first, then rest of args
  try {
    const changeState = (stateChanger) => {
      alterState(stateChangerCatchingError(stateChanger, errorKey))
    }
    const result = handler.apply(null, args);
    // Can return multiple state changers, ensure array, and then loop through
    [].concat(result).forEach(stateChanger => {
      processStateChanger(changeState, stateChanger, storeError)
    })
  }
  // Catch error within handler’s (first) function
  catch (error) {
    storeError(error)
  }
}

// Returns a new stateful component, given the specified state handlers and a pure component to render with
export default (
  alterState,
  handlersIn,
  {
    getProps = () => ({}),
    adjustArgs
  } = {}
) => {
  const state = Object.assign(
    {
      loadError: null,
      handlerError: null
    },
    handlersIn.initial(getProps())
  )

  // Uses `load` handler, if present, to asynchronously load initial state
  function loadAsync(nextProps, prevProps) {
    if (handlersIn.load) {
      callHandler(
        handlersIn.load,
        'loadError',
        [ nextProps, prevProps ],
        alterState
      )
    }
  }

  const handlers = Object.keys(handlersIn).reduce((out, key) => {
    // Special case for `load` handler to reload fresh
    if (key === 'load') {
      out.load = () => {
        loadAsync(getProps(), null)
      }
      return out
    }

    out[key] = (...args) => {
      if (adjustArgs) {
        args = adjustArgs(args)
      }

      callHandler(
        handlersIn[key],
        'handlerError',
        [ Object.assign({}, getProps(), { handlers }) ].concat(args),
        alterState
      )
    }
    return out
  }, {})

  return {
    state,
    loadAsync,
    handlers
  }
}
