// TODO: move to `eventFetching`

let poolAbi = `
[{"type":"event","name":"Fees","inputs":[{"name":"sender","type":"address","indexed":true},{"name":"amount0","type":"uint256","indexed":false},{"name":"amount1","type":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Swap","inputs":[{"name":"sender","type":"address","indexed":true},{"name":"to","type":"address","indexed":true},{"name":"amount0In","type":"uint256","indexed":false},{"name":"amount1In","type":"uint256","indexed":false},{"name":"amount0Out","type":"uint256","indexed":false},{"name":"amount1Out","type":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Sync","inputs":[{"name":"reserve0","type":"uint256","indexed":false},{"name":"reserve1","type":"uint256","indexed":false}],"anonymous":false}]
`->Js.Json.parseExn
let poolFactoryAbi = `
[{"type":"event","name":"PoolCreated","inputs":[{"name":"token0","type":"address","indexed":true},{"name":"token1","type":"address","indexed":true},{"name":"stable","type":"bool","indexed":true},{"name":"pool","type":"address","indexed":false},{"name":"unnamed","type":"uint256","indexed":false}],"anonymous":false}]
`->Js.Json.parseExn
let voterAbi = `
[{"type":"event","name":"DistributeReward","inputs":[{"name":"sender","type":"address","indexed":true},{"name":"gauge","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"GaugeCreated","inputs":[{"name":"poolFactory","type":"address","indexed":true},{"name":"votingRewardsFactory","type":"address","indexed":true},{"name":"gaugeFactory","type":"address","indexed":true},{"name":"pool","type":"address","indexed":false},{"name":"bribeVotingReward","type":"address","indexed":false},{"name":"feeVotingReward","type":"address","indexed":false},{"name":"gauge","type":"address","indexed":false},{"name":"creator","type":"address","indexed":false}],"anonymous":false}]
`->Js.Json.parseExn
