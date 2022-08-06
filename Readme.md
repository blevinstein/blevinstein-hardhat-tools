# Hardhat Tools

## Setup

Add to your project using your preferred package manager:

```bash
npm install blevinstein-hardhat-tools
# OR
yarn add blevinstein-hardhat-tools
```

Then add to your hardhat.config.js file:

```js
require('blevinstein-hardhat-tools');
```

## Tasks

- get-impl: Get the impl address of a deployed proxy.
- gen-mnemonic: Create a new wallet mnemonic.
- list-addresses: Output a list of addresses associated with a known or randomly generated mnemonic.
- sha3: Output the sha3/keccak256 hash of an input string.
- call: Calls a method on a deployed contract.
- deploy: Deploys a new contract, or upgrades the implementation of an already deployed upgradeable contract.
- grant: Grants or revokes a role on an AccessControl contract.

## TODO

- transferOwnership
- revokeOwnership
