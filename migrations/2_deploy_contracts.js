var DtrCoin = artifacts.require("./contracts/DtrCoin.sol");
var DtrCoinMultiSigWallet = artifacts.require("./contracts/DtrCoinMultiSigWallet.sol");
var DtrCoinMultiSigWalletWithMint = artifacts.require("./contracts/DtrCoinMultiSigWalletWithMint.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(DtrCoin, 'DTR', 'DTRCoin', accounts[0], accounts[1], accounts[2]).then( () => {
    console.log(`DtrCoin deployed: address = ${DtrCoin.address}`);

    deployer.
      deploy(DtrCoinMultiSigWallet, [accounts[0], accounts[1], accounts[2]], 2, DtrCoin.address,
          "vault multisig wallet");

      deployer.
      deploy(DtrCoinMultiSigWalletWithMint, [accounts[0], accounts[1], accounts[2]], 2, DtrCoin.address,
          "vault multisig wallet with mint");

  });
};
