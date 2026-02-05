import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Security Tests", () => {
  it("prevents heartbeat from non-owner", () => {
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], wallet1);
    
    // wallet2 tries to heartbeat for wallet1
    const { result } = simnet.callPublicFn(
      "heartbeat-core",
      "heartbeat",
      [],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND (no switch for wallet2)
  });

  it("prevents double registration", () => {
    const user = accounts.get("wallet_4")!;
    
    // First registration
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Second registration attempt
    const { result } = simnet.callPublicFn(
      "heartbeat-core",
      "register-switch",
      [Cl.uint(144), Cl.uint(10)],
      user
    );
    expect(result).toBeErr(Cl.uint(409)); // ERR_ALREADY_EXISTS
  });

  it("prevents withdrawal by non-owner", () => {
    const owner = accounts.get("wallet_5")!;
    const attacker = accounts.get("wallet_6")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], owner);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(1000)], owner);
    
    // Attacker tries to withdraw owner's funds
    const { result } = simnet.callPublicFn(
      "vault",
      "withdraw-stx",
      [Cl.uint(500)],
      attacker
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND (no switch for attacker)
  });

  it("prevents beneficiary modification by non-owner", () => {
    const owner = accounts.get("wallet_7")!;
    const attacker = accounts.get("wallet_8")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], owner);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(attacker), percentage: Cl.uint(100) })
    ]);
    
    // Attacker tries to set themselves as beneficiary
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      attacker
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND
  });

  it("prevents guardian addition by non-owner", () => {
    const owner = accounts.get("wallet_9")!;
    const attacker = accounts.get("deployer")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], owner);
    
    // Attacker tries to add themselves as guardian
    const { result } = simnet.callPublicFn(
      "guardian-network",
      "add-guardian",
      [Cl.principal(attacker)],
      attacker
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND
  });

  it("prevents message modification by non-owner", () => {
    const owner = wallet1;
    const attacker = wallet2;
    
    // Attacker tries to set message for owner's switch
    const { result } = simnet.callPublicFn(
      "vault",
      "set-message",
      [Cl.stringAscii("0xhacked"), Cl.stringUtf8("evil://hack")],
      attacker
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND
  });

  it("enforces interval bounds", () => {
    const user = accounts.get("wallet_2")!;
    
    // Too short (min 144 blocks)
    let { result } = simnet.callPublicFn(
      "heartbeat-core",
      "register-switch",
      [Cl.uint(143), Cl.uint(10)],
      user
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_INTERVAL
    
    // Too long (max 52560 blocks ≈ 1 year)
    const user2 = accounts.get("wallet_3")!;
    ({ result } = simnet.callPublicFn(
      "heartbeat-core",
      "register-switch",
      [Cl.uint(52561), Cl.uint(10)],
      user2
    ));
    expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_INTERVAL
  });

  it("prevents trigger before registration", () => {
    const nonExistentUser = accounts.get("wallet_4")!;
    
    const { result } = simnet.callPublicFn(
      "heartbeat-core",
      "try-trigger",
      [Cl.principal(nonExistentUser)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND
  });
});

describe("Stress Tests", () => {
  it("handles maximum interval (1 year)", () => {
    const user = accounts.get("wallet_5")!;
    
    const { result } = simnet.callPublicFn(
      "heartbeat-core",
      "register-switch",
      [Cl.uint(52560), Cl.uint(10)], // Max interval
      user
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("handles minimum interval (1 day)", () => {
    const user = accounts.get("wallet_6")!;
    
    const { result } = simnet.callPublicFn(
      "heartbeat-core",
      "register-switch",
      [Cl.uint(144), Cl.uint(10)], // Min interval
      user
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("handles large vault deposits", () => {
    const user = accounts.get("wallet_7")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Deposit large amount
    const { result } = simnet.callPublicFn(
      "vault",
      "deposit-stx",
      [Cl.uint(1000000000000)], // 1 million STX in microstacks
      user
    );
    expect(result).toBeOk(Cl.bool(true));
    
    const balance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(balance.result).toBeUint(1000000000000);
  });

  it("handles complex beneficiary distributions", () => {
    const user = accounts.get("wallet_8")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // 10 beneficiaries with varying percentages
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_1")!), percentage: Cl.uint(5) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_2")!), percentage: Cl.uint(8) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_3")!), percentage: Cl.uint(12) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_4")!), percentage: Cl.uint(15) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_5")!), percentage: Cl.uint(7) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_6")!), percentage: Cl.uint(11) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_7")!), percentage: Cl.uint(13) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_8")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_9")!), percentage: Cl.uint(10) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("deployer")!), percentage: Cl.uint(10) })
    ]);
    
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      user
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("handles rapid heartbeat updates", () => {
    const user = accounts.get("wallet_9")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Multiple rapid heartbeats
    for (let i = 0; i < 5; i++) {
      simnet.mineEmptyBlocks(20);
      const { result } = simnet.callPublicFn("heartbeat-core", "heartbeat", [], user);
      expect(result).toBeOk(Cl.bool(true));
    }
  });

  it("handles multiple guardian extensions", () => {
    const user = accounts.get("deployer")!;
    const guardian1 = wallet1;
    const guardian2 = wallet2;
    const guardian3 = wallet3;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("guardian-network", "add-guardian", [Cl.principal(guardian1)], user);
    simnet.callPublicFn("guardian-network", "add-guardian", [Cl.principal(guardian2)], user);
    simnet.callPublicFn("guardian-network", "add-guardian", [Cl.principal(guardian3)], user);
    
    simnet.mineEmptyBlocks(150);
    
    // Each guardian extends once
    let { result: r1 } = simnet.callPublicFn("guardian-network", "extend-deadline", [Cl.principal(user)], guardian1);
    expect(r1).toBeOk(Cl.bool(true));
    
    simnet.mineEmptyBlocks(10);
    
    let { result: r2 } = simnet.callPublicFn("guardian-network", "extend-deadline", [Cl.principal(user)], guardian2);
    expect(r2).toBeOk(Cl.bool(true));
    
    simnet.mineEmptyBlocks(10);
    
    let { result: r3 } = simnet.callPublicFn("guardian-network", "extend-deadline", [Cl.principal(user)], guardian3);
    expect(r3).toBeOk(Cl.bool(true));
  });

  it("handles long message storage", () => {
    const user = wallet1;
    
    // Maximum length strings
    const longHash = "0x" + "a".repeat(62); // 64 chars total (0x + 62)
    const longUri = "ipfs://" + "Q".repeat(46); // 53 chars total
    
    const { result } = simnet.callPublicFn(
      "vault",
      "set-message",
      [Cl.stringAscii(longHash), Cl.stringUtf8(longUri)],
      user
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("handles edge case block timing", () => {
    const user = wallet2;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Mine exactly to deadline (144 + 10 = 154 blocks)
    simnet.mineEmptyBlocks(154);
    
    // Should be triggerable now
    const { result } = simnet.callPublicFn(
      "heartbeat-core",
      "try-trigger",
      [Cl.principal(user)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("handles vault operations across multiple blocks", () => {
    const user = wallet3;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Deposit over multiple blocks
    for (let i = 0; i < 10; i++) {
      simnet.mineEmptyBlocks(5);
      simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(100)], user);
    }
    
    const balance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(balance.result).toBeUint(1000);
    
    // Withdraw in smaller chunks
    for (let i = 0; i < 5; i++) {
      simnet.mineEmptyBlocks(5);
      simnet.callPublicFn("vault", "withdraw-stx", [Cl.uint(50)], user);
    }
    
    const finalBalance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(finalBalance.result).toBeUint(750);
  });
});
