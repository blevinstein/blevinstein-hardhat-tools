require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");

async function getImplAddress(proxyAddress) {
  const implHex = await ethers.provider.getStorageAt(
      proxyAddress,
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
  return ethers.utils.hexStripZeros(implHex);
}

function bigIntReviver(key, value) {
  return typeof value == 'number' ? BigInt(value) : value;
}

function bigIntReplacer(key, value) {
  return typeof value == 'bigint' ? parseInt(value) : value;
}

task('get-impl', 'Prints the proxy and impl addresses')
    .addParam('address')
    .setAction(async (args, hre) => {
  console.log(`Proxy ${args.address} impl ${await getImplAddress(args.address)}`);
});

task('gen-mnemonic', 'Creates a new random wallet mnemonic')
    .setAction(async (args, hre) => {
  console.log(`Random mnemonic: ${ethers.Wallet.createRandom().mnemonic.phrase}`);
});

task('list-addresses', 'Lists addresses associated with a mnemonic')
    .addOptionalParam('mnemonic')
    .addOptionalParam('count')
    .addFlag('privateKeys')
    .addFlag('json')
    .setAction(async (args, hre) => {
  const mnemonic = args.mnemonic || ethers.Wallet.createRandom().mnemonic.phrase;
  const count = args.count || 10;
  console.log(`Mnemonic: ${mnemonic}`);
  for (let i = 0; i < count; ++i) {
    const path = `m/44'/60'/0'/0/${i}`;
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    if (args.json) {
      console.log(JSON.stringify({ address: wallet.address, privateKey: args.privateKeys ? wallet.privateKey : undefined }));
    } else {
      console.log(`Address[${i}] = ${wallet.address}` + (args.privateKeys ? ` key ${wallet.privateKey}` : ''));
    }
  }
});

task('sha3', 'Computes a keccak256 hash')
    .addPositionalParam('input')
    .setAction(async (args, hre) => {
  console.log(`keccak256(${args.input}) = ${ethers.utils.id(args.input)}`);
});

task('call', 'Calls a contract function')
    .addParam('contract', 'Name of the contract')
    .addParam('address', 'Address of the contract')
    .addParam('method', 'Name of the method to call')
    .addOptionalParam('params', 'JSON arguments to method', '[]')
    .setAction(async (args, hre) => {
  const contract = await hre.ethers.getContractAt(args.contract, args.address);
  const params = JSON.parse(args.params, bigIntReviver);

  console.log(`Calling method ${args.method} on ${args.contract} at ${args.address} with params:\n`
      + `${params.map(p => JSON.stringify(p, bigIntReplacer)).join('\n')}`);
  const result = await contract[args.method](...params);
  console.log(`Result: ${JSON.stringify(result)}`);
});

/*
 * Deploys and upgrades contracts.
 *
 * Usage:
 *
 * # Deploy a contract with no initializer params
 * npx hardhat deploy --contract SignatureValidator --network localhost
 *
 * # Deploy an upgradeable contract with no initializer params
 * npx hardhat deploy --contract ArtToken --upgradeable --network localhost
 *
 * # Deploy a contract with initializer params
 * npx hardhat deploy \
 *     --contract RoyaltySplitter \
 *     --params '["0x6047Ac71f35aD757eBEc74aDA7Ee0Ae147740247", []]' \
 *     --network localhost
 *
 * # Upgrade a contract at a given address
 * npx hardhat deploy \
 *     --contract ArtTokenV2 \
 *     --upgradeable \
 *     --address 0x0093b0c1a5df2711576A58942694E80BCC73CeDc \
 *     --network localhost
 */
task('deploy', 'Deploys and upgrades contracts')
    .addParam('contract', 'Name of the contract to deploy')
    .addFlag('upgradeable', 'Flag to indicate the contract is not upgradeable')
    .addFlag('verify', 'Flag to indicate etherscan verification should be performed')
    .addOptionalParam('address', 'Address of the contract to upgrade')
    .addOptionalParam('params', 'JSON params to contract', '[]')
    .setAction(async (args, hre) => {
  console.log(`Using network ${hre.network.name}`);
  const Contract = await hre.ethers.getContractFactory(args.contract);
  const params = JSON.parse(args.params, bigIntReviver);
  let contract;

  if (args.address && args.upgradeable && args.contract) {
    console.log(`Upgrading ${args.contract} at: ${args.address}`);
    await hre.upgrades.upgradeProxy(args.address, Contract);
  } else if (!args.address && args.contract) {
    console.log(`Deploying contract ${args.contract}`);
    if (args.upgradeable) {
      contract = await hre.upgrades.deployProxy(Contract, params);
    } else {
      contract = await Contract.deploy(...params);
    }
    await contract.deployed();
    console.log(`${args.contract} deployed to: ${contract.address}`);
  }

  const contractAddress = args.address || contract.address;

  if (args.upgradeable) {
    const implAddress = await getImplAddress(contractAddress);
    console.log(`${contractAddress} (impl) deployed to: ${implAddress}`);
    if (args.verify) {
      console.log(`Verifying contract at ${implAddress}`);
      await hre.run('verify:verify', { address: implAddress });
    }
  } else if (args.verify) {
    console.log(`Verifying contract at ${contractAddress}`);
    await hre.run('verify:verify', { address: contractAddress, constructorArguments: params });
  }

  console.log('Deploy complete.');
  return contractAddress;
});

/*
 * Grants and revokes roles.
 *
 * Usage:
 *
 * # Grant a role to a user.
 * npx hardhat grant \
 *     --address 0x11CED8aA8d02848429aF8dae3eC9F0796ba2db91 \
 *     --role AUTHORIZER \
 *     --actor 0xB4ce9cb1788dCd15969Ba01573516F6fBf7dA51c \
 *     --network localhost
 *
 * # Revoke a previously granted role.
 * npx hardhat grant \
 *     --address 0x11CED8aA8d02848429aF8dae3eC9F0796ba2db91 \
 *     --role AUTHORIZER \
 *     --actor 0xB4ce9cb1788dCd15969Ba01573516F6fBf7dA51c \
 *     --network localhost \
 *     --revoke
 */
task('grant', 'Grants or revokes a role')
    .addParam('address', 'Address of the contract to grant access to')
    .addFlag('revoke', 'Flag to revoke instead of granting a role')
    .addParam('actor', 'Address of the actor to grant or revoke access')
    .addParam('role', 'String to keccak256 to get the role identifier')
    .addFlag('upgradeable', 'Indicates the contract is upgradeable')
    .setAction(async (args, hre) => {
  console.log(`Using network ${hre.network.name}`);
  const contract = await hre.ethers.getContractAt(
      args.upgradeable ? 'AccessControlUpgradeable' : 'AccessControl',
      args.address);

  const roleId = hre.ethers.utils.id(args.role);
  if (args.revoke) {
    const tx = await contract.revokeRole(roleId, args.actor);
    console.log(
        `Revoke role ${args.role} (${roleId}) from address ${args.actor} ` +
        `(for contract at ${args.address}), txn=${tx.hash}`);
  } else {
    const tx = await contract.grantRole(roleId, args.actor);
    console.log(
        `Grant role ${args.role} (${roleId}) to address ${args.actor} ` +
        `(for contract at ${args.address}), txn=${tx.hash}`);
  }
});

task('transfer-ownership', 'Transfers ownership of a contract, or renounces ownership')
    .addParam('address', 'Address of the contract to grant access to')
    .addFlag('renounce', 'Flag to renounce instead of transferring ownership')
    .addFlag('upgradeable', 'Indicates the contract is upgradeable')
    .addOptionalParam('newOwner', 'Address that will receive ownership')
    .setAction(async (args, hre) => {
  console.log(`Using network ${hre.network.name}`);
  const contract = await hre.ethers.getContractAt(
      args.upgradeable ? 'OwnableUpgradeable' : 'Ownable',
      args.address);

  if (args.renounce) {
    if (args.newOwner) {
      throw new Error('Cannot provide newOwner when revoking ownership.');
    }

    const tx = await contract.renounceOwnership();
    console.log(`Renounced ownership of contract at ${args.address}, txn=${tx.hash}`);
  } else {
    if (!args.newOwner) {
      throw new Error('Must provide newOwner when transferring ownership.');
    }

    const tx = await contract.transferOwnership(args.newOwner);
    console.log(
        `Transferred ownership of contract at ${args.address} to ${args.newOwner}, txn=${tx.hash}`);
  }
});

