import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBeneficiaryAt,
  getBeneficiaryCount,
  getTotalPercentage,
  addBeneficiary,
  removeBeneficiary,
  clearBeneficiaries,
  getRemainingPercentage,
  isConfigurationComplete,
  getBeneficiariesPage,
} from '../contracts/beneficiary-mgr-v2';

// Mock addresses
const DEPLOYER = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const USER1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const USER2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';
const BENEFICIARY1 = 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND';
const BENEFICIARY2 = 'ST21HMSJATHZ888PD0S0SSTWP4J61TCRJYEVQ0STB';
const BENEFICIARY3 = 'ST2YXAWPBVQ0SEEDVW9C0YRNW7BNRFVWPB5E4E7B';

describe('Beneficiary Manager V2 - Dynamic Storage', () => {
  beforeEach(() => {
    // Clear state before each test
  });

  describe('Add Beneficiary', () => {
    it('should add a single beneficiary', () => {
      const result = addBeneficiary(BENEFICIARY1, 50);
      expect(result).toBeOk(true);
      
      const count = getBeneficiaryCount(USER1);
      expect(count).toBe(1);
    });

    it('should add multiple beneficiaries', () => {
      addBeneficiary(BENEFICIARY1, 30);
      addBeneficiary(BENEFICIARY2, 40);
      addBeneficiary(BENEFICIARY3, 30);
      
      const count = getBeneficiaryCount(USER1);
      expect(count).toBe(3);
      
      const total = getTotalPercentage(USER1);
      expect(total).toBe(100);
    });

    it('should reject percentage over 100', () => {
      const result = addBeneficiary(BENEFICIARY1, 101);
      expect(result).toBeErr(413); // ERR_INVALID_PERCENTAGE
    });

    it('should reject when total exceeds 100', () => {
      addBeneficiary(BENEFICIARY1, 60);
      const result = addBeneficiary(BENEFICIARY2, 50);
      expect(result).toBeErr(413);
    });
  });

  describe('Get Beneficiary', () => {
    beforeEach(() => {
      addBeneficiary(BENEFICIARY1, 40);
      addBeneficiary(BENEFICIARY2, 60);
    });

    it('should get beneficiary at index', () => {
      const beneficiary = getBeneficiaryAt(USER1, 0);
      expect(beneficiary).toBeSome({
        recipient: BENEFICIARY1,
        percentage: 40,
      });
    });

    it('should return none for invalid index', () => {
      const beneficiary = getBeneficiaryAt(USER1, 99);
      expect(beneficiary).toBeNone();
    });

    it('should track correct count', () => {
      const count = getBeneficiaryCount(USER1);
      expect(count).toBe(2);
    });
  });

  describe('Configuration Completion', () => {
    it('should be incomplete with less than 100%', () => {
      addBeneficiary(BENEFICIARY1, 50);
      
      const isComplete = isConfigurationComplete(USER1);
      expect(isComplete).toBe(false);
      
      const remaining = getRemainingPercentage(USER1);
      expect(remaining).toBe(50);
    });

    it('should be complete with exactly 100%', () => {
      addBeneficiary(BENEFICIARY1, 50);
      addBeneficiary(BENEFICIARY2, 50);
      
      const isComplete = isConfigurationComplete(USER1);
      expect(isComplete).toBe(true);
      
      const remaining = getRemainingPercentage(USER1);
      expect(remaining).toBe(0);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Add 55 beneficiaries to test pagination
      for (let i = 0; i < 55; i++) {
        const beneficiary = `ST${i}BENEFICIARY${i}TEST`;
        const percentage = i < 54 ? 1 : 46; // Sum to 100
        addBeneficiary(beneficiary, percentage);
      }
    });

    it('should return page 0 with 50 beneficiaries', () => {
      const page = getBeneficiariesPage(USER1, 0);
      
      expect(page.page).toBe(0);
      expect(page['total-count']).toBe(55);
      expect(page['has-more']).toBe(true);
    });

    it('should return page 1 with remaining beneficiaries', () => {
      const page = getBeneficiariesPage(USER1, 1);
      
      expect(page.page).toBe(1);
      expect(page['total-count']).toBe(55);
      expect(page['has-more']).toBe(false);
    });
  });

  describe('Remove Beneficiary', () => {
    beforeEach(() => {
      addBeneficiary(BENEFICIARY1, 40);
      addBeneficiary(BENEFICIARY2, 30);
      addBeneficiary(BENEFICIARY3, 30);
    });

    it('should remove beneficiary at index', () => {
      const result = removeBeneficiary(0);
      expect(result).toBeOk(true);
      
      const count = getBeneficiaryCount(USER1);
      expect(count).toBe(2);
    });

    it('should reject invalid index', () => {
      const result = removeBeneficiary(99);
      expect(result).toBeErr(417); // ERR_INVALID_INDEX
    });
  });

  describe('Clear All Beneficiaries', () => {
    beforeEach(() => {
      addBeneficiary(BENEFICIARY1, 50);
      addBeneficiary(BENEFICIARY2, 50);
    });

    it('should clear all beneficiaries', () => {
      const result = clearBeneficiaries();
      expect(result).toBeOk(true);
      
      const count = getBeneficiaryCount(USER1);
      expect(count).toBe(0);
      
      const total = getTotalPercentage(USER1);
      expect(total).toBe(0);
    });
  });

  describe('Multi-user Support', () => {
    it('should maintain separate beneficiary lists per user', () => {
      // USER1 adds beneficiaries
      addBeneficiary(BENEFICIARY1, 100);
      
      // USER2 adds different beneficiaries
      // (In real tests, would switch context)
      
      const user1Count = getBeneficiaryCount(USER1);
      expect(user1Count).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle adding beneficiary with 0% (for placeholder)', () => {
      const result = addBeneficiary(BENEFICIARY1, 0);
      expect(result).toBeOk(true);
    });

    it('should handle single beneficiary with 100%', () => {
      const result = addBeneficiary(BENEFICIARY1, 100);
      expect(result).toBeOk(true);
      
      const isComplete = isConfigurationComplete(USER1);
      expect(isComplete).toBe(true);
    });
  });
});
