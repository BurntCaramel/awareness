import makeAwareness from './index'

export const applyAction = (prevState, action, args = []) => {
  return new Promise((resolve, reject) => {
    const { handlers } = makeAwareness(
      (stateChanger) => {
        resolve(Object.assign({}, prevState, stateChanger(prevState)))
      },
      {
        initial: () => prevState,
        actionToRun: action
      },
      {
        transformErrorForKey: (key) => (error) => reject(error)
      }
    )

    handlers.actionToRun(...args)
  })
}
