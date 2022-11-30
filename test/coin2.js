"use strict"

var DtrCoin = artifacts.require("./DtrCoin.sol");
const theBN = require("bn.js")

/**
 * DtrCoin contract tests 2
 */
contract('DtrCoin2', function(accounts) {
  const BIG = (v) => new theBN.BN(v)

  const owner = accounts[0];
  const admin = accounts[1];
  const vault = accounts[2];
  const minter = accounts[0];

  const user1 = accounts[4];
  const user2 = accounts[5];
  const user3 = accounts[6];
  const user4 = accounts[7];
  const user5 = accounts[8];

  let coin, OneDtrCoinInMinunit, NoOfTokens, NoOfTokensInMinunit;

  const bnBalanceOf = async addr => await coin.balanceOf(addr);
  const bnReserveOf = async addr => await coin.reserveOf(addr);
  const bnAllowanceOf = async (owner, spender) => await coin.allowance(owner, spender);

  const balanceOf = async addr => (await coin.balanceOf(addr)).toString();
  const reserveOf = async addr => (await coin.reserveOf(addr)).toString();
  const allowanceOf = async (owner, spender) => (await coin.allowance(owner,spender)).toString();


  before(async () => {
    coin = await DtrCoin.deployed();
    NoOfTokensInMinunit = await coin.totalSupply();
    OneDtrCoinInMinunit = await coin.getOneDtrCoin();
    NoOfTokens = NoOfTokensInMinunit.div(OneDtrCoinInMinunit)
  });

  const clearUser = async user => {
    await coin.setReserve(user, 0, {from: admin});
    await coin.transfer(vault, await bnBalanceOf(user), {from: user});
  };

  beforeEach(async () => {
    await clearUser(user1);
    await clearUser(user2);
    await clearUser(user3);
    await clearUser(user4);
    await clearUser(user5);
  });

  it("reserve and then approve", async() => {
    assert.equal(await balanceOf(user4), "0");

    const OneDtrTimesTwoInMinunit = OneDtrCoinInMinunit.mul(BIG(2))
    const OneDtrTimesTwoInMinunitStr = OneDtrTimesTwoInMinunit.toString()

    const OneDtrTimesOneInMinunit = OneDtrCoinInMinunit.mul(BIG(1))
    const OneDtrTimesOneInMinunitStr = OneDtrTimesOneInMinunit.toString()

    // send 2 Dtr to user4 and set 1 Dtr reserve
    coin.transfer(user4, OneDtrTimesTwoInMinunit, {from: vault});
    coin.setReserve(user4, OneDtrCoinInMinunit, {from: admin});
    assert.equal(await balanceOf(user4), OneDtrTimesTwoInMinunitStr);
    assert.equal(await reserveOf(user4), OneDtrCoinInMinunit.toString());

    // approve 2 Dtr to user5
    await coin.approve(user5, OneDtrTimesTwoInMinunit, {from:user4});
    assert.equal(await allowanceOf(user4, user5), OneDtrTimesTwoInMinunitStr);

    // transfer 2 Dtr from user4 to user5 SHOULD NOT BE POSSIBLE
    try {
      await coin.transferFrom(user4, user5, OneDtrTimesTwoInMinunit, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    // transfer 1 Dtr from user4 to user5 SHOULD BE POSSIBLE
    await coin.transferFrom(user4, user5, OneDtrTimesOneInMinunit, {from: user5});
    assert.equal(await balanceOf(user4), OneDtrTimesOneInMinunitStr);
    assert.equal(await reserveOf(user4), OneDtrTimesOneInMinunitStr); // reserve will not change
    assert.equal(await allowanceOf(user4, user5), OneDtrTimesOneInMinunitStr); // allowance will be reduced
    assert.equal(await balanceOf(user5), OneDtrTimesOneInMinunitStr);
    assert.equal(await reserveOf(user5), "0");

    // transfer .5 Dtr from user4 to user5 SHOULD NOT BE POSSIBLE if balance <= reserve
    const halfDtrInMinunit = OneDtrCoinInMinunit.div(BIG(2));
    try {
      await coin.transferFrom(user4, user5, halfDtrInMinunit, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  })

  it("only minter can call mint", async() => {
      const OneDtrTimesTenInMinunit = OneDtrCoinInMinunit.mul(BIG(10))
      const OneDtrTimesTenInMinunitStr = OneDtrTimesTenInMinunit.toString()

      assert.equal(await balanceOf(user4), "0");

      await coin.mint(user4, OneDtrTimesTenInMinunit, {from: minter})

      const totalSupplyAfterMintStr = (await coin.totalSupply()).toString()
      assert.equal(totalSupplyAfterMintStr, OneDtrTimesTenInMinunit.add(NoOfTokensInMinunit).toString())
      assert.equal(await balanceOf(user4), OneDtrTimesTenInMinunitStr);

      try {
          await coin.mint(user4, OneDtrTimesTenInMinunit, {from: user4})
          assert.fail();
      } catch(exception) {
          assert.equal(totalSupplyAfterMintStr, OneDtrTimesTenInMinunit.add(NoOfTokensInMinunit).toString())
          assert.isTrue(exception.message.includes("revert"));
      }
  })

  it("cannot mint above the mint cap", async() => {
      const OneDtrTimes100BilInMinunit = 
              OneDtrCoinInMinunit.mul(BIG(100000000000))

      assert.equal(await balanceOf(user4), "0");


      try {
          await coin.mint(user4, OneDtrTimes100BilInMinunit, {from: minter})
          assert.fail();
      } catch(exception) {
          assert.isTrue(exception.message.includes("revert"));
      }
  })
});
