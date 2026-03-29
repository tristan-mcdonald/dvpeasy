/**
 * Input validation manager for form input validation operations.
 * Provides methods for validating NFT token IDs and ERC20 token amounts.
 */
export const inputValidationManager = {
  /**
   * Validates that a value is a valid NFT token ID (non-negative integer).
   * @param value - The value to validate
   * @returns Object with isValid boolean and optional error message
   */
  validateNFTTokenId (value: string): { isValid: boolean; error?: string } {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Token ID is required' };
    }

    // Check if it's a valid number.
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return { isValid: false, error: 'Token ID must be a number' };
    }

    // Check if it's an integer.
    if (!Number.isInteger(numericValue)) {
      return { isValid: false, error: 'Token ID must be an integer' };
    }

    // Check if it's non-negative.
    if (numericValue < 0) {
      return { isValid: false, error: 'Token ID must be non-negative' };
    }

    return { isValid: true };
  },

  /**
   * Validates that a value is a valid token amount for ERC20 tokens.
   * @param value - The value to validate
   * @returns Object with isValid boolean and optional error message
   */
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
