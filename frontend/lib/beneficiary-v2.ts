/**
 * Beneficiary Manager V2 Frontend Utilities
 * Helper functions for working with dynamic beneficiary storage
 */

export interface Beneficiary {
  recipient: string;
  percentage: number;
}

export interface BeneficiaryPage {
  page: number;
  totalCount: number;
  hasMore: boolean;
  beneficiaries: Beneficiary[];
}

export interface BeneficiaryState {
  count: number;
  totalPercentage: number;
  remainingPercentage: number;
  isComplete: boolean;
}

/**
 * Fetch all beneficiaries for a user with automatic pagination
 */
export async function getAllBeneficiaries(
  owner: string,
  contractCall: (method: string, args: any[]) => Promise<any>
): Promise<Beneficiary[]> {
  const allBeneficiaries: Beneficiary[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await contractCall('get-beneficiaries-page', [owner, page]);
    
    if (result && result.beneficiaries) {
      allBeneficiaries.push(...result.beneficiaries);
      hasMore = result.hasMore;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allBeneficiaries;
}

/**
 * Get beneficiary state summary
 */
export async function getBeneficiaryState(
  owner: string,
  contractCall: (method: string, args: any[]) => Promise<any>
): Promise<BeneficiaryState> {
  const [count, totalPercentage, remainingPercentage, isComplete] = await Promise.all([
    contractCall('get-beneficiary-count', [owner]),
    contractCall('get-total-percentage-read', [owner]),
    contractCall('get-remaining-percentage', [owner]),
    contractCall('is-configuration-complete', [owner]),
  ]);

  return {
    count: count || 0,
    totalPercentage: totalPercentage || 0,
    remainingPercentage: remainingPercentage || 100,
    isComplete: isComplete || false,
  };
}

/**
 * Validate beneficiary input
 */
export function validateBeneficiary(
  recipient: string,
  percentage: number,
  currentState: BeneficiaryState
): { valid: boolean; error?: string } {
  // Validate percentage range
  if (percentage < 0 || percentage > 100) {
    return { valid: false, error: 'Percentage must be between 0 and 100' };
  }

  // Validate recipient address
  if (!recipient || !recipient.startsWith('ST') && !recipient.startsWith('SP')) {
    return { valid: false, error: 'Invalid Stacks address' };
  }

  // Check if adding would exceed 100%
  if (currentState.totalPercentage + percentage > 100) {
    return { 
      valid: false, 
      error: `Adding ${percentage}% would exceed 100% (${currentState.remainingPercentage}% remaining)` 
    };
  }

  // Check max beneficiaries
  if (currentState.count >= 1000) {
    return { valid: false, error: 'Maximum 1,000 beneficiaries reached' };
  }

  return { valid: true };
}

/**
 * Calculate equal distribution percentages
 */
export function calculateEqualDistribution(count: number): number[] {
  if (count === 0) return [];
  
  const basePercentage = Math.floor(100 / count);
  const remainder = 100 - (basePercentage * count);
  
  const percentages = new Array(count).fill(basePercentage);
  
  // Distribute remainder to first beneficiaries
  for (let i = 0; i < remainder; i++) {
    percentages[i]++;
  }
  
  return percentages;
}

/**
 * Normalize percentages to sum to 100
 */
export function normalizePercentages(percentages: number[]): number[] {
  const total = percentages.reduce((sum, p) => sum + p, 0);
  
  if (total === 0) return percentages;
  if (total === 100) return percentages;
  
  const normalized = percentages.map(p => Math.floor((p / total) * 100));
  const normalizedTotal = normalized.reduce((sum, p) => sum + p, 0);
  const difference = 100 - normalizedTotal;
  
  // Distribute difference to first beneficiaries
  if (difference > 0) {
    for (let i = 0; i < difference && i < normalized.length; i++) {
      normalized[i]++;
    }
  }
  
  return normalized;
}

/**
 * Format beneficiary for display
 */
export function formatBeneficiary(beneficiary: Beneficiary): string {
  const shortAddress = `${beneficiary.recipient.slice(0, 6)}...${beneficiary.recipient.slice(-4)}`;
  return `${shortAddress} (${beneficiary.percentage}%)`;
}

/**
 * Sort beneficiaries by percentage (descending)
 */
export function sortByPercentage(beneficiaries: Beneficiary[]): Beneficiary[] {
  return [...beneficiaries].sort((a, b) => b.percentage - a.percentage);
}

/**
 * Group beneficiaries by percentage ranges
 */
export function groupByPercentageRange(beneficiaries: Beneficiary[]): Record<string, Beneficiary[]> {
  const groups: Record<string, Beneficiary[]> = {
    'high': [],    // >= 25%
    'medium': [],  // 10-24%
    'low': [],     // 1-9%
    'minimal': [], // < 1%
  };

  beneficiaries.forEach(b => {
    if (b.percentage >= 25) groups.high.push(b);
    else if (b.percentage >= 10) groups.medium.push(b);
    else if (b.percentage >= 1) groups.low.push(b);
    else groups.minimal.push(b);
  });

  return groups;
}

/**
 * Estimate gas cost for adding beneficiaries
 */
export function estimateGasCost(beneficiaryCount: number): number {
  // Base cost + per-beneficiary cost (simplified estimation)
  const baseCost = 5000;
  const perBeneficiaryCost = 1000;
  return baseCost + (beneficiaryCount * perBeneficiaryCost);
}

/**
 * Check if migration is needed
 */
export async function needsMigration(
  owner: string,
  contractCallV1: (method: string, args: any[]) => Promise<any>,
  contractCallV2: (method: string, args: any[]) => Promise<any>
): Promise<boolean> {
  try {
    const v1Beneficiaries = await contractCallV1('get-beneficiaries', [owner]);
    const v2Count = await contractCallV2('get-beneficiary-count', [owner]);
    
    return v1Beneficiaries && v1Beneficiaries.length > 0 && v2Count === 0;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Batch beneficiary operations
 */
export interface BeneficiaryOperation {
  type: 'add' | 'remove';
  recipient?: string;
  percentage?: number;
  index?: number;
}

export function optimizeBeneficiaryOperations(
  operations: BeneficiaryOperation[]
): BeneficiaryOperation[] {
  // Remove duplicates and conflicts
  const optimized: BeneficiaryOperation[] = [];
  const seen = new Set<string>();

  for (const op of operations) {
    const key = op.type === 'add' 
      ? `add-${op.recipient}` 
      : `remove-${op.index}`;
    
    if (!seen.has(key)) {
      optimized.push(op);
      seen.add(key);
    }
  }

  return optimized;
}

export default {
  getAllBeneficiaries,
  getBeneficiaryState,
  validateBeneficiary,
  calculateEqualDistribution,
  normalizePercentages,
  formatBeneficiary,
  sortByPercentage,
  groupByPercentageRange,
  estimateGasCost,
  needsMigration,
  optimizeBeneficiaryOperations,
};
