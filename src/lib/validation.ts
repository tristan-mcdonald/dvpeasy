/**
 * Checking the flow form's amount as it's typed, with a message for each problem.
 */
export const inputValidationManager = {
  validateNFTTokenId (value: string): { isValid: boolean; error?: string } {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Token ID is required' };
    }

    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return { isValid: false, error: 'Token ID must be a number' };
    }

    if (!Number.isInteger(numericValue)) {
      return { isValid: false, error: 'Token ID must be an integer' };
    }

    if (numericValue < 0) {
      return { isValid: false, error: 'Token ID must be non-negative' };
    }

    return { isValid: true };
  },

  validateTokenAmount (value: string): { isValid: boolean; error?: string } {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Amount is required' };
    }

    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return { isValid: false, error: 'Amount must be a valid number' };
    }

    if (numericValue <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }

    return { isValid: true };
  },
};
