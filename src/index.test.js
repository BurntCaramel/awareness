import expect from 'expect'

import makeAwareness from './index'

const delay = 100

const waitMs = duration => new Promise(resolve => setTimeout(resolve, duration))
const nextFrame = () => new Promise((resolve) => {
  window.requestAnimationFrame(resolve)
})

const error1 = new Error('Error one')
const error2 = new Error('Error two')

const handlers = {
  initial: () => ({ number: 0 }),
  one: () => ({ number: 1 }),
  two: async () => {
    await waitMs(delay)
    return { number: 2 }
  },
  threeFour: function * () {
    yield waitMs(delay)
    yield { number: 3 }
    yield { number: 4 }
  },
  double: () => ({ number }) => ({ number: number * 2 }),
  asyncDouble: async () => {
    await waitMs(delay)
    return ({ number }) => ({ number: number * 2 })
  },
  yieldDouble: function * () {
    yield ({ number }) => ({ number: number * 2 })
    yield ({ number }) => ({ number: number * 2 })
  },
  doError1: () => { throw error1 },
  doError2Async: async () => {
    await waitMs(delay)
    throw error2
  },
  load: async (next, prev) => {
    if (!prev || next.loadWait != prev.loadWait) {
      await waitMs(next.loadWait)
      return ({ loadCount = 0 }) => ({ waited: next.loadWait, loadCount: loadCount + 1 })
    }

    return { waited: 0 }
  }
}

describe('with default options', () => {
  let history = null
  let latest = () => history[history.length - 1]
  let awareness = null

  beforeEach(() => {
    awareness = makeAwareness(
      (stateChanger) => {
        let previous = latest()
        let updated = Object.assign({}, previous, stateChanger(previous))
        history.push(updated)
      },
      handlers
    )
    history = [
      awareness.state
    ]
  })

  it('handles actions', async () => {
    const { handlers: actions } = awareness

    expect(latest()).toEqual({
      number: 0,
      handlerError: null,
      loadError: null
    })

    actions.one()
    expect(latest()).toEqual({
      number: 1,
      handlerError: null,
      loadError: null
    })

    actions.two()
    await waitMs(delay)
    expect(latest()).toEqual({
      number: 2,
      handlerError: null,
      loadError: null
    })

    actions.threeFour()
    await nextFrame()
    await waitMs(delay)
    await nextFrame()
    await waitMs(delay)
    expect(history.slice(-2)).toEqual([
      {
        number: 3,
        handlerError: null,
        loadError: null
      },
      {
        number: 4,
        handlerError: null,
        loadError: null
      }
    ])

    actions.double()
    expect(latest()).toEqual({
      number: 8,
      handlerError: null,
      loadError: null
    })

    actions.asyncDouble()
    await waitMs(delay)
    expect(latest()).toEqual({
      number: 16,
      handlerError: null,
      loadError: null
    })

    actions.yieldDouble()
    await nextFrame()
    await nextFrame()
    await nextFrame()
    expect(latest()).toEqual({
      number: 64,
      handlerError: null,
      loadError: null
    })

    actions.doError1()
    expect(latest()).toEqual({
      number: 64,
      handlerError: error1,
      loadError: null
    })

    actions.doError2Async()
    await waitMs(delay)
    expect(latest()).toEqual({
      number: 64,
      handlerError: error2,
      loadError: null
    })
  })

  it('load', async () => {
    const { handlers: actions, loadAsync } = awareness

    expect(latest()).toEqual({
      number: 0,
      handlerError: null,
      loadError: null
    })

    // Initial load
    loadAsync({ loadWait: 100 })
    await waitMs(100)
    expect(latest()).toEqual({
      number: 0,
      waited: 100,
      loadCount: 1,
      handlerError: null,
      loadError: null
    })

    // With same data
    loadAsync({ loadWait: 100 }, { loadWait: 100 })
    await waitMs(100)
    expect(latest()).toEqual({
      number: 0,
      waited: 0,
      loadCount: 1,
      handlerError: null,
      loadError: null
    })

    // With new data
    loadAsync({ loadWait: 50 }, { loadWait: 100 })
    await waitMs(50)
    expect(latest()).toEqual({
      number: 0,
      waited: 50,
      loadCount: 2,
      handlerError: null,
      loadError: null
    })

    // Reload
    loadAsync({ loadWait: 50 }, null)
    await waitMs(50)
    expect(latest()).toEqual({
      number: 0,
      waited: 50,
      loadCount: 3,
      handlerError: null,
      loadError: null
    })
  })
})
