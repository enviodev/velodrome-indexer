type functionRegister = Loader | Handler

let mapFunctionRegisterName = (functionRegister: functionRegister) => {
  switch functionRegister {
  | Loader => "Loader"
  | Handler => "Handler"
  }
}

// This set makes sure that the warning doesn't print for every event of a type, but rather only prints the first time.
let hasPrintedWarning = Set.make()

@genType
type handlerFunction<'eventArgs, 'context, 'returned> = (
  ~event: Types.eventLog<'eventArgs>,
  ~context: 'context,
) => 'returned

@genType
type handlerWithContextGetter<
  'eventArgs,
  'context,
  'returned,
  'loaderContext,
  'handlerContextSync,
  'handlerContextAsync,
> = {
  handler: handlerFunction<'eventArgs, 'context, 'returned>,
  contextGetter: Context.genericContextCreatorFunctions<
    'loaderContext,
    'handlerContextSync,
    'handlerContextAsync,
  > => 'context,
}

@genType
type handlerWithContextGetterSyncAsync<
  'eventArgs,
  'loaderContext,
  'handlerContextSync,
  'handlerContextAsync,
> = SyncAsync.t<
  handlerWithContextGetter<
    'eventArgs,
    'handlerContextSync,
    unit,
    'loaderContext,
    'handlerContextSync,
    'handlerContextAsync,
  >,
  handlerWithContextGetter<
    'eventArgs,
    'handlerContextAsync,
    promise<unit>,
    'loaderContext,
    'handlerContextSync,
    'handlerContextAsync,
  >,
>

@genType
type loader<'eventArgs, 'loaderContext> = (
  ~event: Types.eventLog<'eventArgs>,
  ~context: 'loaderContext,
) => unit

let getDefaultLoaderHandler: (
  ~functionRegister: functionRegister,
  ~eventName: string,
  ~event: 'a,
  ~context: 'b,
) => unit = (~functionRegister, ~eventName, ~event as _, ~context as _) => {
  let functionName = mapFunctionRegisterName(functionRegister)

  // Here we use this key to prevent flooding the users terminal with
  let repeatKey = `${eventName}-${functionName}`
  if !(hasPrintedWarning->Set.has(repeatKey)) {
    // Here are docs on the 'terminal hyperlink' formatting that I use to link to the docs: https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda
    Logging.warn(
      `Skipped ${eventName} in the ${functionName}, as there is no ${functionName} registered. You need to implement a ${eventName}${functionName} method in your handler file or ignore this warning if you don't intend to implement it. Here are our docs on this topic: \\u001b]8;;https://docs.envio.dev/docs/event-handlers\u0007https://docs.envio.dev/docs/event-handlers\u001b]8;;\u0007`,
    )
    let _ = hasPrintedWarning->Set.add(repeatKey)
  }
}

let getDefaultLoaderHandlerWithContextGetter = (~functionRegister, ~eventName) => SyncAsync.Sync({
  handler: getDefaultLoaderHandler(~functionRegister, ~eventName),
  contextGetter: ctx => ctx.getHandlerContextSync(),
})

module PoolContract = {
  module Fees = {
    open Types.PoolContract.FeesEvent

    type handlerWithContextGetter = handlerWithContextGetterSyncAsync<
      eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    %%private(
      let feesLoader: ref<option<loader<eventArgs, loaderContext>>> = ref(None)
      let feesHandler: ref<option<handlerWithContextGetter>> = ref(None)
    )

    @genType
    let loader = loader => {
      feesLoader := Some(loader)
    }

    @genType
    let handler = handler => {
      feesHandler := Some(Sync({handler, contextGetter: ctx => ctx.getHandlerContextSync()}))
    }

    // Silence the "this statement never returns (or has an unsound type.)" warning in the case that the user hasn't specified `isAsync` in their config file yet.
    @warning("-21") @genType
    let handlerAsync = handler => {
      Js.Exn.raiseError("Please add 'isAsync: true' to your config.yaml file to enable Async Mode.")

      feesHandler := Some(Async({handler, contextGetter: ctx => ctx.getHandlerContextAsync()}))
    }

    let getLoader = () =>
      feesLoader.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="Fees", ~functionRegister=Loader),
      )

    let getHandler = () =>
      switch feesHandler.contents {
      | Some(handler) => handler
      | None =>
        getDefaultLoaderHandlerWithContextGetter(~eventName="Fees", ~functionRegister=Handler)
      }

    let handlerIsAsync = () => getHandler()->SyncAsync.isAsync
  }
  module Swap = {
    open Types.PoolContract.SwapEvent

    type handlerWithContextGetter = handlerWithContextGetterSyncAsync<
      eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    %%private(
      let swapLoader: ref<option<loader<eventArgs, loaderContext>>> = ref(None)
      let swapHandler: ref<option<handlerWithContextGetter>> = ref(None)
    )

    @genType
    let loader = loader => {
      swapLoader := Some(loader)
    }

    @genType
    let handler = handler => {
      swapHandler := Some(Sync({handler, contextGetter: ctx => ctx.getHandlerContextSync()}))
    }

    // Silence the "this statement never returns (or has an unsound type.)" warning in the case that the user hasn't specified `isAsync` in their config file yet.
    @warning("-21") @genType
    let handlerAsync = handler => {
      Js.Exn.raiseError("Please add 'isAsync: true' to your config.yaml file to enable Async Mode.")

      swapHandler := Some(Async({handler, contextGetter: ctx => ctx.getHandlerContextAsync()}))
    }

    let getLoader = () =>
      swapLoader.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="Swap", ~functionRegister=Loader),
      )

    let getHandler = () =>
      switch swapHandler.contents {
      | Some(handler) => handler
      | None =>
        getDefaultLoaderHandlerWithContextGetter(~eventName="Swap", ~functionRegister=Handler)
      }

    let handlerIsAsync = () => getHandler()->SyncAsync.isAsync
  }
  module Sync = {
    open Types.PoolContract.SyncEvent

    type handlerWithContextGetter = handlerWithContextGetterSyncAsync<
      eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    %%private(
      let syncLoader: ref<option<loader<eventArgs, loaderContext>>> = ref(None)
      let syncHandler: ref<option<handlerWithContextGetter>> = ref(None)
    )

    @genType
    let loader = loader => {
      syncLoader := Some(loader)
    }

    @genType
    let handler = handler => {
      syncHandler := Some(Sync({handler, contextGetter: ctx => ctx.getHandlerContextSync()}))
    }

    // Silence the "this statement never returns (or has an unsound type.)" warning in the case that the user hasn't specified `isAsync` in their config file yet.
    @warning("-21") @genType
    let handlerAsync = handler => {
      Js.Exn.raiseError("Please add 'isAsync: true' to your config.yaml file to enable Async Mode.")

      syncHandler := Some(Async({handler, contextGetter: ctx => ctx.getHandlerContextAsync()}))
    }

    let getLoader = () =>
      syncLoader.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="Sync", ~functionRegister=Loader),
      )

    let getHandler = () =>
      switch syncHandler.contents {
      | Some(handler) => handler
      | None =>
        getDefaultLoaderHandlerWithContextGetter(~eventName="Sync", ~functionRegister=Handler)
      }

    let handlerIsAsync = () => getHandler()->SyncAsync.isAsync
  }
}

module PoolFactoryContract = {
  module PoolCreated = {
    open Types.PoolFactoryContract.PoolCreatedEvent

    type handlerWithContextGetter = handlerWithContextGetterSyncAsync<
      eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    %%private(
      let poolCreatedLoader: ref<option<loader<eventArgs, loaderContext>>> = ref(None)
      let poolCreatedHandler: ref<option<handlerWithContextGetter>> = ref(None)
    )

    @genType
    let loader = loader => {
      poolCreatedLoader := Some(loader)
    }

    @genType
    let handler = handler => {
      poolCreatedHandler := Some(Sync({handler, contextGetter: ctx => ctx.getHandlerContextSync()}))
    }

    // Silence the "this statement never returns (or has an unsound type.)" warning in the case that the user hasn't specified `isAsync` in their config file yet.
    @warning("-21") @genType
    let handlerAsync = handler => {
      poolCreatedHandler :=
        Some(Async({handler, contextGetter: ctx => ctx.getHandlerContextAsync()}))
    }

    let getLoader = () =>
      poolCreatedLoader.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="PoolCreated", ~functionRegister=Loader),
      )

    let getHandler = () =>
      switch poolCreatedHandler.contents {
      | Some(handler) => handler
      | None =>
        getDefaultLoaderHandlerWithContextGetter(
          ~eventName="PoolCreated",
          ~functionRegister=Handler,
        )
      }

    let handlerIsAsync = () => getHandler()->SyncAsync.isAsync
  }
}

module VoterContract = {
  module DistributeReward = {
    open Types.VoterContract.DistributeRewardEvent

    type handlerWithContextGetter = handlerWithContextGetterSyncAsync<
      eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    %%private(
      let distributeRewardLoader: ref<option<loader<eventArgs, loaderContext>>> = ref(None)
      let distributeRewardHandler: ref<option<handlerWithContextGetter>> = ref(None)
    )

    @genType
    let loader = loader => {
      distributeRewardLoader := Some(loader)
    }

    @genType
    let handler = handler => {
      distributeRewardHandler :=
        Some(Sync({handler, contextGetter: ctx => ctx.getHandlerContextSync()}))
    }

    // Silence the "this statement never returns (or has an unsound type.)" warning in the case that the user hasn't specified `isAsync` in their config file yet.
    @warning("-21") @genType
    let handlerAsync = handler => {
      Js.Exn.raiseError("Please add 'isAsync: true' to your config.yaml file to enable Async Mode.")

      distributeRewardHandler :=
        Some(Async({handler, contextGetter: ctx => ctx.getHandlerContextAsync()}))
    }

    let getLoader = () =>
      distributeRewardLoader.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="DistributeReward", ~functionRegister=Loader),
      )

    let getHandler = () =>
      switch distributeRewardHandler.contents {
      | Some(handler) => handler
      | None =>
        getDefaultLoaderHandlerWithContextGetter(
          ~eventName="DistributeReward",
          ~functionRegister=Handler,
        )
      }

    let handlerIsAsync = () => getHandler()->SyncAsync.isAsync
  }
  module GaugeCreated = {
    open Types.VoterContract.GaugeCreatedEvent

    type handlerWithContextGetter = handlerWithContextGetterSyncAsync<
      eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    %%private(
      let gaugeCreatedLoader: ref<option<loader<eventArgs, loaderContext>>> = ref(None)
      let gaugeCreatedHandler: ref<option<handlerWithContextGetter>> = ref(None)
    )

    @genType
    let loader = loader => {
      gaugeCreatedLoader := Some(loader)
    }

    @genType
    let handler = handler => {
      gaugeCreatedHandler :=
        Some(Sync({handler, contextGetter: ctx => ctx.getHandlerContextSync()}))
    }

    // Silence the "this statement never returns (or has an unsound type.)" warning in the case that the user hasn't specified `isAsync` in their config file yet.
    @warning("-21") @genType
    let handlerAsync = handler => {
      Js.Exn.raiseError("Please add 'isAsync: true' to your config.yaml file to enable Async Mode.")

      gaugeCreatedHandler :=
        Some(Async({handler, contextGetter: ctx => ctx.getHandlerContextAsync()}))
    }

    let getLoader = () =>
      gaugeCreatedLoader.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="GaugeCreated", ~functionRegister=Loader),
      )

    let getHandler = () =>
      switch gaugeCreatedHandler.contents {
      | Some(handler) => handler
      | None =>
        getDefaultLoaderHandlerWithContextGetter(
          ~eventName="GaugeCreated",
          ~functionRegister=Handler,
        )
      }

    let handlerIsAsync = () => getHandler()->SyncAsync.isAsync
  }
}

module VotingRewardContract = {
  module NotifyReward = {
    open Types.VotingRewardContract.NotifyRewardEvent

    type handlerWithContextGetter = handlerWithContextGetterSyncAsync<
      eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    %%private(
      let notifyRewardLoader: ref<option<loader<eventArgs, loaderContext>>> = ref(None)
      let notifyRewardHandler: ref<option<handlerWithContextGetter>> = ref(None)
    )

    @genType
    let loader = loader => {
      notifyRewardLoader := Some(loader)
    }

    @genType
    let handler = handler => {
      notifyRewardHandler :=
        Some(Sync({handler, contextGetter: ctx => ctx.getHandlerContextSync()}))
    }

    // Silence the "this statement never returns (or has an unsound type.)" warning in the case that the user hasn't specified `isAsync` in their config file yet.
    @warning("-21") @genType
    let handlerAsync = handler => {
      Js.Exn.raiseError("Please add 'isAsync: true' to your config.yaml file to enable Async Mode.")

      notifyRewardHandler :=
        Some(Async({handler, contextGetter: ctx => ctx.getHandlerContextAsync()}))
    }

    let getLoader = () =>
      notifyRewardLoader.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="NotifyReward", ~functionRegister=Loader),
      )

    let getHandler = () =>
      switch notifyRewardHandler.contents {
      | Some(handler) => handler
      | None =>
        getDefaultLoaderHandlerWithContextGetter(
          ~eventName="NotifyReward",
          ~functionRegister=Handler,
        )
      }

    let handlerIsAsync = () => getHandler()->SyncAsync.isAsync
  }
}
