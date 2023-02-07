import { tokens, EVM_REVERT } from "./helpers";
const { default: Web3 } = require("web3");

const Token = artifacts.require("./Token");

require("chai").use(require("chai-as-promised")).should();

contract("Token", ([deployer, recevier, exchange]) => {
    const name = "yh1225 Token";
    const symbol = "YHT";
    const decimals = "18";
    const totalSupply = tokens(1000000).toString();

    let token;
    beforeEach(async () => {
        token = await Token.new();
    });

    describe("deployment", () => {
        it("tracks the name", async () => {
            const result = await token.name();
            result.should.equal(name);
        });

        it("tracks the symbol", async () => {
            const result = await token.symbol();
            result.toString().should.equal(symbol);
        });

        it("tracks the decimals", async () => {
            const result = await token.decimals();
            result.toString().should.equal(decimals);
        });

        it("tracks the total supply", async () => {
            const result = await token.totalSupply();
            result.toString().should.equal(totalSupply);
        });

        it("tracks the total supply to the deployer", async () => {
            const result = await token.balanceOf(deployer);
            result.toString().should.equal(totalSupply);
        });
    });

    describe("sending tokens", () => {
        let result;
        let amount;

        describe("success", async () => {
            beforeEach(async () => {
                amount = tokens(10);
                result = await token.transfer(recevier, amount, { from: deployer });
            });

            it("transfers token balances", async () => {
                let balanceOf;
                balanceOf = await token.balanceOf(deployer);
                console.log("deployer balance before transfer", balanceOf.toString());
                balanceOf = await token.balanceOf(recevier);
                console.log("receiver balance before transfer", balanceOf.toString());
                await token.transfer(recevier, amount, { from: deployer });
                //after
                balanceOf = await token.balanceOf(deployer);
                console.log("deployer balance after transfer", balanceOf.toString());
                balanceOf = await token.balanceOf(recevier);
                console.log("receiver balance after transfer", balanceOf.toString());
            });
            it("emits a transfer event", async () => {
                console.log("result", result);
                const log = result.logs[0];
                log.event.should.eq("Transfer");
                const event = log.args;
                event.from.toString().should.equal(deployer, "from is correct");
                event.to.should.equal(recevier, "to is correct");
                event.value
                    .toString()
                    .should.equal(amount.toString(), "value is correct");
            });
        });

        describe("failure", async () => {
            it("rejects insufficient balances", async () => {
                let invalidAmount;
                invalidAmount = tokens(1000000000);
                await token
                    .transfer(recevier, invalidAmount, { from: deployer })
                    .should.be.rejectedWith(EVM_REVERT);
            });
        });
    });

    describe("approving tokens", () => {
        let result;
        let amount;
        beforeEach(async () => {
            amount = tokens(100);
            result = await token.approve(exchange, amount, { from: deployer });
        });

        describe("success", () => {
            it("allocates an allowance for delegated token spending on exchange", async () => {
                const allowance = await token.allowance(deployer, exchange);
                allowance.toString().should.equal(amount.toString());
            });
            it("emit the Approval event", async () => {
                const log = result.logs[0];
                log.event.should.eq("Approval");

                const event = log.args;
                event._owner.toString().should.equal(deployer, "owner is correct");
                event._spender.should.equal(exchange, "spender is correct");
                event._value
                    .toString()
                    .should.equal(amount.toString(), "value is correct");
            });
        });

        describe("failure", () => {
            it("rejects invalid spenders", async () => {
                await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
            });
        });
    });
});
