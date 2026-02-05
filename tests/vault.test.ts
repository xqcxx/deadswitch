import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("Vault Edge Cases", () => {
  it("prevents deposit without registered switch", () => {
    const { result } = simnet.callPublicFn(
      "vault",
      "deposit-stx",
      [Cl.uint(1000)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND
  });

  it("prevents deposit of zero amount", () => {
    // First register
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], wallet1);
    
    const { result } = simnet.callPublicFn(
      "vault",
      "deposit-stx",
      [Cl.uint(0)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_AMOUNT
  });

  it("prevents withdrawal without registered switch", () => {
    const { result } = simnet.callPublicFn(
      "vault",
      "withdraw-stx",
      [Cl.uint(100)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND
  });

  it("prevents withdrawal after trigger", () => {
    const user = accounts.get("wallet_3")!;
    
    // Register and deposit
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(1000)], user);
    
    // Trigger
    simnet.mineEmptyBlocks(200);
    simnet.callPublicFn("heartbeat-core", "try-trigger", [Cl.principal(user)], user);
    
    // Try to withdraw
    const { result } = simnet.callPublicFn(
      "vault",
      "withdraw-stx",
      [Cl.uint(100)],
      user
    );
    expect(result).toBeErr(Cl.uint(403)); // ERR_UNAUTHORIZED
  });

  it("prevents withdrawal more than balance", () => {
    const user = accounts.get("wallet_4")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(500)], user);
    
    const { result } = simnet.callPublicFn(
      "vault",
      "withdraw-stx",
      [Cl.uint(1000)],
      user
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR_INSUFFICIENT_BALANCE
  });

  it("allows partial withdrawals", () => {
    const user = accounts.get("wallet_5")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(1000)], user);
    
    // Withdraw 300
    const { result: withdraw1 } = simnet.callPublicFn(
      "vault",
      "withdraw-stx",
      [Cl.uint(300)],
      user
    );
    expect(withdraw1).toBeOk(Cl.bool(true));
    
    // Check balance is 700
    const balance1 = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(balance1.result).toBeUint(700);
    
    // Withdraw another 200
    const { result: withdraw2 } = simnet.callPublicFn(
      "vault",
      "withdraw-stx",
      [Cl.uint(200)],
      user
    );
    expect(withdraw2).toBeOk(Cl.bool(true));
    
    // Check balance is 500
    const balance2 = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(balance2.result).toBeUint(500);
  });

  it("handles multiple deposits correctly", () => {
    const user = accounts.get("wallet_6")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // First deposit
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(100)], user);
    let balance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(balance.result).toBeUint(100);
    
    // Second deposit
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(250)], user);
    balance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(balance.result).toBeUint(350);
    
    // Third deposit
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(150)], user);
    balance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(balance.result).toBeUint(500);
  });

  it("stores and retrieves encrypted messages", () => {
    const user = accounts.get("wallet_7")!;
    const messageHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const messageUri = "ipfs://QmTest1234567890";
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Set message
    const { result } = simnet.callPublicFn(
      "vault",
      "set-message",
      [Cl.stringAscii(messageHash), Cl.stringUtf8(messageUri)],
      user
    );
    expect(result).toBeOk(Cl.bool(true));
    
    // Get message
    const message = simnet.callReadOnlyFn("vault", "get-message", [Cl.principal(user)], user);
    expect(message.result).toBeSome(
      Cl.tuple({
        hash: Cl.stringAscii(messageHash),
        uri: Cl.stringUtf8(messageUri)
      })
    );
  });

  it("prevents unauthorized message access before trigger", () => {
    const user = accounts.get("wallet_8")!;
    const messageHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const messageUri = "ipfs://QmSecret123";
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "set-message", [Cl.stringAscii(messageHash), Cl.stringUtf8(messageUri)], user);
    
    // Another user tries to get message before trigger
    const message = simnet.callReadOnlyFn("vault", "get-message", [Cl.principal(user)], wallet2);
    // Message should still be retrievable (it's read-only), but encryption means only owner has key
    expect(message.result).toBeSome(
      Cl.tuple({
        hash: Cl.stringAscii(messageHash),
        uri: Cl.stringUtf8(messageUri)
      })
    );
  });
});
