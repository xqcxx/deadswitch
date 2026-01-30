import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Heartbeat Core", () => {
  it("allows registering a switch", () => {
    const { result } = simnet.callPublicFn(
      "heartbeat-core",
      "register-switch",
      [Cl.uint(144), Cl.uint(10)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents registering with invalid interval", () => {
    const { result } = simnet.callPublicFn(
      "heartbeat-core",
      "register-switch",
      [Cl.uint(10), Cl.uint(10)], // Too short (min 144)
      wallet1
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_INTERVAL
  });

  it("updates heartbeat", () => {
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], wallet2);
    
    simnet.mineEmptyBlocks(100);
    
    const { result } = simnet.callPublicFn("heartbeat-core", "heartbeat", [], wallet2);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("allows triggering after deadline", () => {
    // Register for wallet1 (re-using simnet state if persistent? Vitest resets usually?)
    // Simnet state is reset per test file, but maybe not per test?
    // Let's assume per-test isolation isn't guaranteed by default unless configured.
    // Use a fresh wallet (wallet_3) just in case, or rely on previous state.
    // Actually, let's just use wallet1 but check if it's already registered.
    // If registered, fine.
    
    // Just in case, let's use a new wallet for this test to be safe.
    const wallet3 = accounts.get("wallet_3")!;
    
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], wallet3);
    
    // Advance past deadline (144 + 10 = 154 blocks from start)
    simnet.mineEmptyBlocks(200);
    
    const { result } = simnet.callPublicFn("heartbeat-core", "try-trigger", [Cl.principal(wallet3)], wallet2);
    expect(result).toBeOk(Cl.bool(true));
    
    const isTriggered = simnet.callReadOnlyFn("heartbeat-core", "is-triggered", [Cl.principal(wallet3)], wallet3);
    expect(isTriggered.result).toBeBool(true);
  });
});
