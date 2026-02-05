export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateInterval(interval: number): ValidationResult {
  if (!Number.isInteger(interval)) {
    return { valid: false, error: 'Interval must be a whole number' };
  }
  if (interval < 144) {
    return { valid: false, error: 'Interval must be at least 144 blocks (~1 day)' };
  }
  if (interval > 52560) {
    return { valid: false, error: 'Interval cannot exceed 52560 blocks (~1 year)' };
  }
  return { valid: true };
}

export function validateGracePeriod(gracePeriod: number): ValidationResult {
  if (!Number.isInteger(gracePeriod)) {
    return { valid: false, error: 'Grace period must be a whole number' };
  }
  if (gracePeriod < 10) {
    return { valid: false, error: 'Grace period must be at least 10 blocks' };
  }
  if (gracePeriod > 10000) {
    return { valid: false, error: 'Grace period cannot exceed 10000 blocks' };
  }
  return { valid: true };
}

export function validateAmount(amount: number, min: number = 0): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  if (amount <= min) {
    return { valid: false, error: `Amount must be greater than ${min}` };
  }
  if (!Number.isInteger(amount)) {
    return { valid: false, error: 'Amount must be a whole number (in microSTX)' };
  }
  return { valid: true };
}

export function validatePrincipal(address: string): ValidationResult {
  if (!address || address.trim() === '') {
    return { valid: false, error: 'Address cannot be empty' };
  }
  
  // Basic Stacks address validation
  const stacksAddressRegex = /^(SP|ST)[0-9A-Z]{38,41}$/;
  if (!stacksAddressRegex.test(address)) {
    return { valid: false, error: 'Invalid Stacks address format' };
  }
  
  return { valid: true };
}

export function validateBeneficiaries(
  beneficiaries: Array<{ recipient: string; percentage: number }>
): ValidationResult {
  if (beneficiaries.length === 0) {
    return { valid: false, error: 'At least one beneficiary is required' };
  }
  
  if (beneficiaries.length > 10) {
    return { valid: false, error: 'Maximum 10 beneficiaries allowed' };
  }
  
  let totalPercentage = 0;
  for (const ben of beneficiaries) {
    const addrValidation = validatePrincipal(ben.recipient);
    if (!addrValidation.valid) {
      return { valid: false, error: `Invalid beneficiary address: ${addrValidation.error}` };
    }
    
    if (!Number.isInteger(ben.percentage) || ben.percentage < 0 || ben.percentage > 100) {
      return { valid: false, error: 'Each percentage must be a whole number between 0-100' };
    }
    
    totalPercentage += ben.percentage;
  }
  
  if (totalPercentage !== 100) {
    return { valid: false, error: `Total percentage must equal 100% (currently ${totalPercentage}%)` };
  }
  
  return { valid: true };
}
