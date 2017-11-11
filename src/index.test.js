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
  }
}

describe('with default options', () => {
  let history = null
  let latest = () => history[history.length - 1]

  beforeEach(() => {
    history = []
  })

  it('handles actions', async () => {
    const { state: initialState, handlers: actions, loadAsync } = makeAwareness(
      (stateChanger) => {
        let previous = latest()
        let updated = Object.assign({}, previous, stateChanger(previous))
        history.push(updated)
      },
      handlers
    )

    history.push(initialState)
    expect(initialState).toEqual({
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
})
