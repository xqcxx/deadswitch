import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Integration Flow", () => {
  it("full flow: register -> deposit -> timeout -> trigger -> distribute", () => {
    // 1. Register
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], wallet1);

    // 2. Deposit 1000 STX
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(1000)], wallet1);

    // 3. Set Beneficiaries (50% to wallet2, 50% to wallet3)
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(50) }),
      Cl.tuple({ recipient: Cl.principal(wallet3), percentage: Cl.uint(50) })
    ]);
    simnet.callPublicFn("beneficiary-mgr", "set-beneficiaries", [beneficiaries], wallet1);

    // 4. Timeout
    simnet.mineEmptyBlocks(200);

    // 5. Execute Trigger (idempotent, handles try-trigger internally)
    const { result } = simnet.callPublicFn("trigger-actions", "execute-trigger", [Cl.principal(wallet1)], wallet2);
    expect(result).toBeOk(Cl.bool(true));

    // 6. Verify triggered state
    const isTriggered = simnet.callReadOnlyFn("heartbeat-core", "is-triggered", [Cl.principal(wallet1)], wallet1);
    expect(isTriggered.result).toBeBool(true);

    // 7. Verify balances (Simnet doesn't track STX balances easily without getting asset map, but we can check vault balance is 0)
    const vaultBalance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(wallet1)], wallet1);
    expect(vaultBalance.result).toBeUint(0);
  });

  it("sweeps remainder correctly", () => {
    const user = accounts.get("wallet_4")!;
    const ben1 = accounts.get("wallet_5")!;
    const ben2 = accounts.get("wallet_6")!;

    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(100)], user); // 100 STX

    // 33% + 33% + 33% = 99%. 
    // Wait, beneficiary-mgr enforces 100%.
    // So we must provide 33, 33, 34 to sum to 100.
    // If we provide 33, 33, 34:
    // 33% of 100 = 33.
    // 33% of 100 = 33.
    // 34% of 100 = 34.
    // Sum = 100. Remainder = 0.
    // So "sweep" only happens if division creates dust.
    // e.g. 100 STX. 3 beneficiaries. 33, 33, 34.
    // If we had 101 STX.
    // 33% of 101 = 33.33 -> 33.
    // 33% of 101 = 33.
    // 34% of 101 = 34.34 -> 34.
    // Total = 33+33+34 = 100.
    // Original = 101. Remainder = 1.
    // This 1 should go to first beneficiary.

    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(ben1), percentage: Cl.uint(33) }), // First ben
      Cl.tuple({ recipient: Cl.principal(ben2), percentage: Cl.uint(33) }),
      Cl.tuple({ recipient: Cl.principal(user), percentage: Cl.uint(34) }) // Just usage
    ]);
    simnet.callPublicFn("beneficiary-mgr", "set-beneficiaries", [beneficiaries], user);
    
    // Deposit 101
    simnet.callPublicFn("vault", "deposit-stx", [Cl.uint(1)], user); // +1 to make 101 total

    simnet.mineEmptyBlocks(200);
    simnet.callPublicFn("trigger-actions", "execute-trigger", [Cl.principal(user)], ben1);

    const vaultBalance = simnet.callReadOnlyFn("vault", "get-balance", [Cl.principal(user)], user);
    expect(vaultBalance.result).toBeUint(0);
  });
});
