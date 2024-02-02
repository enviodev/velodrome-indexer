open Belt

module Chain = {
  type t = Chain_10

  let all = [Chain_10]

  let toChainId = chain =>
    switch chain {
    | Chain_10 => 10
    }

  let toString = chain => chain->toChainId->Int.toString

  exception UndefinedChain(int)

  let fromChainId = chainId =>
    switch chainId {
    | 10 => Ok(Chain_10)
    | c => Error(UndefinedChain(c))
    }

  let t_encode: Spice.encoder<t> = chain => {
    chain->toChainId->Spice.intToJson
  }

  let t_decode: Spice.decoder<t> = json => {
    json
    ->Spice.intFromJson
    ->Result.flatMap(c =>
      switch c->fromChainId {
      | Ok(chain) => Ok(chain)
      | Error(_) => Spice.error(~path="ChainMap.chain", "Undefined chain", json)
      }
    )
  }

  module ChainIdCmp = Belt.Id.MakeComparable({
    type t = t
    let cmp = (a, b) => Pervasives.compare(a->toChainId, b->toChainId)
  })
}

type t<'a> = Belt.Map.t<Chain.ChainIdCmp.t, 'a, Chain.ChainIdCmp.identity>

let make = (fn: Chain.t => 'a): t<'a> => {
  Chain.all
  ->Array.map(chainId => (chainId, chainId->fn))
  ->Map.fromArray(~id=module(Chain.ChainIdCmp))
}

let get: (t<'a>, Chain.t) => 'a = (self, chain) =>
  //Can safely get exn since all chains must be set
  Map.get(self, chain)->Option.getExn

let set: (t<'a>, Chain.t, 'a) => t<'a> = Map.set
let values: t<'a> => array<'a> = Map.valuesToArray
let entries: t<'a> => array<(Chain.t, 'a)> = Map.toArray
let map: (t<'a>, 'a => 'b) => t<'b> = Map.map
let mapWithKey: (t<'a>, (Chain.t, 'a) => 'b) => t<'b> = Map.mapWithKey
let size: t<'a> => int = Map.size
