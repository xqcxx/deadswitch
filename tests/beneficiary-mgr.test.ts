import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Beneficiary Manager", () => {
  it("prevents setting beneficiaries without switch", () => {
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(100) })
    ]);
    
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND
  });

  it("prevents beneficiaries that don't sum to 100%", () => {
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], wallet1);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(50) }),
      Cl.tuple({ recipient: Cl.principal(wallet3), percentage: Cl.uint(30) })
    ]);
    
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_PERCENTAGE
  });

  it("prevents beneficiaries that exceed 100%", () => {
    const user = accounts.get("wallet_4")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(60) }),
      Cl.tuple({ recipient: Cl.principal(wallet3), percentage: Cl.uint(50) })
    ]);
    
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      user
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_PERCENTAGE
  });

  it("prevents empty beneficiary list", () => {
    const user = accounts.get("wallet_5")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    const beneficiaries = Cl.list([]);
    
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      user
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_PERCENTAGE (0% total)
  });

  it("prevents more than 10 beneficiaries", () => {
    const user = accounts.get("wallet_6")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Create 11 beneficiaries with 9% each (except last with 10% to sum to 100%)
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_1")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_2")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_3")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_4")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_5")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_6")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_7")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_8")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_9")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("deployer")!), percentage: Cl.uint(9) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_1")!), percentage: Cl.uint(10) })
    ]);
    
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      user
    );
    expect(result).toBeErr(Cl.uint(400)); // ERR_TOO_MANY
  });

  it("allows exactly 10 beneficiaries", () => {
    const user = accounts.get("wallet_7")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // Create 10 beneficiaries with 10% each
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_1")!), percentage: Cl.uint(10) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_2")!), percentage: Cl.uint(10) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_3")!), percentage: Cl.uint(10) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_4")!), percentage: Cl.uint(10) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_5")!), percentage: Cl.uint(10) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_6")!), percentage: Cl.uint(10) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_7")!), percentage: Cl.uint(10) }),
      Cl.tuple({ recipient: Cl.principal(accounts.get("wallet_8")!), percentage: Cl.uint(10) }),
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

  it("allows updating beneficiaries multiple times", () => {
    const user = accounts.get("wallet_8")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    // First set
    let beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet1), percentage: Cl.uint(100) })
    ]);
    let { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      user
    );
    expect(result).toBeOk(Cl.bool(true));
    
    // Update
    beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(50) }),
      Cl.tuple({ recipient: Cl.principal(wallet3), percentage: Cl.uint(50) })
    ]);
    ({ result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      user
    ));
    expect(result).toBeOk(Cl.bool(true));
  });

  it("retrieves beneficiary list correctly", () => {
    const user = accounts.get("wallet_9")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet1), percentage: Cl.uint(30) }),
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(30) }),
      Cl.tuple({ recipient: Cl.principal(wallet3), percentage: Cl.uint(40) })
    ]);
    
    simnet.callPublicFn("beneficiary-mgr", "set-beneficiaries", [beneficiaries], user);
    
    const retrieved = simnet.callReadOnlyFn(
      "beneficiary-mgr",
      "get-beneficiaries",
      [Cl.principal(user)],
      user
    );
    
    expect(retrieved.result).toBeSome(beneficiaries);
  });

  it("prevents unauthorized users from setting beneficiaries", () => {
    const user = accounts.get("deployer")!;
    simnet.callPublicFn("heartbeat-core", "register-switch", [Cl.uint(144), Cl.uint(10)], user);
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet1), percentage: Cl.uint(100) })
    ]);
    
    // wallet2 tries to set beneficiaries for user
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      wallet2 // Wrong caller
    );
    expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND (no switch for wallet2)
  });

  it("handles zero percentage correctly", () => {
    const user = accounts.get("wallet_1")!;
    // Note: wallet_1 might already have a switch from previous tests
    // In a proper test suite, we'd use beforeEach to reset state
    // For now, let's check if registered first
    
    const beneficiaries = Cl.list([
      Cl.tuple({ recipient: Cl.principal(wallet2), percentage: Cl.uint(0) }),
      Cl.tuple({ recipient: Cl.principal(wallet3), percentage: Cl.uint(100) })
    ]);
    
    const { result } = simnet.callPublicFn(
      "beneficiary-mgr",
      "set-beneficiaries",
      [beneficiaries],
      user
    );
    // Should succeed as total is 100%
    expect(result).toBeOk(Cl.bool(true));
  });
});
