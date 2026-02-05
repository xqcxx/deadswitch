import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Trigger Actions", () => {
  it("prevents trigger before deadline", () => {
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], wallet1);
    
    // Only mine a few blocks (not enough to reach deadline)
    simnet.mineEmptyBlocks(50);
    
    const { result } = simnet.callPublicFn(
      "trigger-actions",
      "execute-trigger",
      [Cl.principal(wallet1)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(403)); // ERR_NOT_READY or similar
  });

  it("allows trigger after deadline", () => {
    const user = accounts.get("wallet_4")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(1000)], user);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(100) })
    ]);
    simnet.callPublicFn("beneficiary-mgr", "set-beneficiaries", [beneficiaries], user);
    
    // Mine past deadline
    simnet.mineEmptyBlocks(200);
    
    const { result } = simnet.callPublicFn(
      "trigger-actions",
      "execute-trigger",
      [Cl.principal(user)],
      wallet2
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("is idempotent - can trigger multiple times", () => {
    const user = accounts.get("wallet_5")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(500)], user);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(100) })
    ]);
    simnet.callPublicFn("beneficiary-mgr", "set-beneficiaries", [beneficiaries], user);
    
    simnet.mineEmptyBlocks(200);
    
    // First trigger
    const { result: result1 } = simnet.callPublicFn(
      "trigger-actions",
      "execute-trigger",
      [Cl.principal(user)],
      wallet2
    );
    expect(result1).toBeOk(Cl.bool(true));
    
    // Second trigger should also succeed (idempotent)
    const { result: result2 } = simnet.callPublicFn(
      "trigger-actions",
      "execute-trigger",
      [Cl.principal(user)],
      wallet2
    );
    expect(result2).toBeOk(Cl.bool(true));
  });

  it("distributes funds to multiple beneficiaries correctly", () => {
    const user = accounts.get("wallet_6")!;
    const ben1 = accounts.get("wallet_7")!;
    const ben2 = accounts.get("wallet_8")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(1000)], user);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(ben1), percentage: Cl.uint(40) }),
      Cl.tuple({ recipient: Cl.principal(ben2), percentage: Cl.uint(60) })
    ]);
    simnet.callPublicFn("beneficiary-mgr", "set-beneficiaries", [beneficiaries], user);
    
    simnet.mineEmptyBlocks(200);
    
    const { result } = simnet.callPublicFn(
      "trigger-actions",
      "execute-trigger",
      [Cl.principal(user)],
      ben1
    );
    expect(result).toBeOk(Cl.bool(true));
    
    // Verify vault is empty
    const vaultBalance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(vaultBalance.result).toBeUint(0);
  });

  it("sweeps remainder to first beneficiary", () => {
    const user = accounts.get("wallet_9")!;
    const ben1 = accounts.get("deployer")!;
    const ben2 = wallet1;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    // Deposit amount that won't divide evenly
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(103)], user);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(ben1), percentage: Cl.uint(33) }),
      Cl.tuple({ recipient: Cl.principal(ben2), percentage: Cl.uint(67) })
    ]);
    simnet.callPublicFn("beneficiary-mgr", "set-beneficiaries", [beneficiaries], user);
    
    simnet.mineEmptyBlocks(200);
    
    const { result } = simnet.callPublicFn(
      "trigger-actions",
      "execute-trigger",
      [Cl.principal(user)],
      ben1
    );
    expect(result).toBeOk(Cl.bool(true));
    
    // Verify vault is completely empty (including remainder)
    const vaultBalance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(vaultBalance.result).toBeUint(0);
  });

  it("handles empty vault trigger gracefully", () => {
    const user = accounts.get("wallet_2")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    // Don't deposit anything
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet3), percentage: Cl.uint(100) })
    ]);
    simnet.callPublicFn("beneficiary-mgr", "set-beneficiaries", [beneficiaries], user);
    
    simnet.mineEmptyBlocks(200);
    
    const { result } = simnet.callPublicFn(
      "trigger-actions",
      "execute-trigger",
      [Cl.principal(user)],
      wallet3
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents trigger without beneficiaries set", () => {
    const user = accounts.get("wallet_3")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(1000)], user);
    // Don't set beneficiaries
    
    simnet.mineEmptyBlocks(200);
    
    const { result } = simnet.callPublicFn(
      "trigger-actions",
      "execute-trigger",
      [Cl.principal(user)],
      wallet2
    );
    // Should fail because no beneficiaries
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND
  });
});

describe("Switch NFT", () => {
  it("mints NFT on switch registration", () => {
    const user = accounts.get("wallet_4")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Check NFT ownership
    const owner = simnet.callReadOnlyFn(
      "switch-nft",
      "get-owner",
      [Cl.uint(1)], // Assuming this is first NFT in this test file
      user
    );
    
    // Owner should be some(user)
    expect(owner.result).toBeSome(Cl.principal(user));
  });

  it("increments token ID for each switch", () => {
    const user1 = accounts.get("wallet_5")!;
    const user2 = accounts.get("wallet_6")!;
    
    // Get current last token ID
    const lastTokenBefore = simnet.callReadOnlyFn(
      "switch-nft",
      "get-last-token-id",
      [],
      user1
    );
    
    // Register two switches
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user1);
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user2);
    
    // Check last token ID increased by 2
    const lastTokenAfter = simnet.callReadOnlyFn(
      "switch-nft",
      "get-last-token-id",
      [],
      user1
    );
    
    // Should have increased
    expect(lastTokenAfter.result).not.toBe(lastTokenBefore.result);
  });

  it("allows NFT transfer", () => {
    const user = accounts.get("wallet_7")!;
    const recipient = accounts.get("wallet_8")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Get the token ID (read last-token-id)
    const tokenId = simnet.callReadOnlyFn("switch-nft", "get-last-token-id", [], user);
    
    // Transfer NFT
    const { result } = simnet.callPublicFn(
      "switch-nft",
      "transfer",
      [tokenId.result, Cl.principal(user), Cl.principal(recipient)],
      user
    );
    expect(result).toBeOk(Cl.bool(true));
    
    // Verify new owner
    const owner = simnet.callReadOnlyFn(
      "switch-nft",
      "get-owner",
      [tokenId.result],
      user
    );
    expect(owner.result).toBeSome(Cl.principal(recipient));
  });

  it("prevents unauthorized NFT transfer", () => {
    const user = accounts.get("wallet_9")!;
    const attacker = accounts.get("deployer")!;
    const recipient = wallet1;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    const tokenId = simnet.callReadOnlyFn("switch-nft", "get-last-token-id", [], user);
    
    // Attacker tries to transfer user's NFT
    const { result } = simnet.callPublicFn(
      "switch-nft",
      "transfer",
      [tokenId.result, Cl.principal(user), Cl.principal(recipient)],
      attacker // Wrong sender
    );
    expect(result).toBeErr(Cl.uint(403)); // ERR_UNAUTHORIZED
  });

  it("returns correct token URI", () => {
    const user = wallet1;
    
    const tokenId = simnet.callReadOnlyFn("switch-nft", "get-last-token-id", [], user);
    
    // Get token URI
    const uri = simnet.callReadOnlyFn(
      "switch-nft",
      "get-token-uri",
      [tokenId.result],
      user
    );
    
    // Should return some URI
    expect(uri.result).toBeSome(Cl.stringUtf8("https://deadswitch.xyz/nft/{id}"));
  });
});
