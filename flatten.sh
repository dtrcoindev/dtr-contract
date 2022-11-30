#!/bin/zsh
truffle-flattener contracts/DtrCoin.sol > DtrCoin.flatten.sol
truffle-flattener contracts/DtrCoinMultiSigWallet.sol > DtrCoinMultiSigWallet.flatten.sol
