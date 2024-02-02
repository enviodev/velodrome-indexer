let registerPoolHandlers = () => {
  try {
    let _ = %raw(`require("../../src/EventHandlers.ts")`)
  } catch {
  | err => {
      Logging.error(
        "EE500: There was an issue importing the handler file for Pool. Expected file at ../../src/EventHandlers.ts",
      )
      Js.log(err)
    }
  }
}
let registerPoolFactoryHandlers = () => {
  try {
    let _ = %raw(`require("../../src/EventHandlers.ts")`)
  } catch {
  | err => {
      Logging.error(
        "EE500: There was an issue importing the handler file for PoolFactory. Expected file at ../../src/EventHandlers.ts",
      )
      Js.log(err)
    }
  }
}
let registerVoterHandlers = () => {
  try {
    let _ = %raw(`require("../../src/EventHandlers.ts")`)
  } catch {
  | err => {
      Logging.error(
        "EE500: There was an issue importing the handler file for Voter. Expected file at ../../src/EventHandlers.ts",
      )
      Js.log(err)
    }
  }
}

let registerAllHandlers = () => {
  registerPoolHandlers()
  registerPoolFactoryHandlers()
  registerVoterHandlers()
}
