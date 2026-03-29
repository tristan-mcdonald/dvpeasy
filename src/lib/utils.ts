import React from 'react';
import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';

/**
 * Utility manager for general utility functions.
 * Provides methods for styling, input handling, address formatting, date formatting, and comparison.
 */
export const utilityManager = {
  /**
   * Merge class names with Tailwind CSS utilities.
   */
  cn (...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  },

  /**
   * Handle trimming whitespace from input values on blur.
   */
  handleInputBlur (
    event: React.FocusEvent<HTMLInputElement>,
    onChange: (value: string) => void,
  ) {
    const trimmedValue = event.target.value.trim();
    if (trimmedValue !== event.target.value) {
      onChange(trimmedValue);
    }
  },

  /**
   * Create input props with onChange and onBlur handlers for trimming.
   */
  createTrimmedInputProps (
    value: string,
    onChange: (value: string) => void,
  ) {
    return {
      value,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => this.handleInputBlur(event, onChange),
    };
  },

  /**
   * Shorten an address for display purposes.
   */
  shortenAddress (address: string, length: number = 6): string {
    if (!address || address.length <= length * 2) return address;
    return `${address.slice(0, length)}…${address.slice(-length)}`;
  },

  /**
   * Format date as 'Y-m-d H:i' to match Flatpickr format.
   */
  formatDateForFlatpickr (date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * Deep comparison of two values to determine if they are equal.
   * Handles objects, arrays, primitives, and special cases like Date objects.
   */
  isEqual (a: unknown, b: unknown): boolean {
    // Handle simple cases first
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (a === undefined || b === undefined) return a === b;

    // Handle different types
    const typeA = typeof a;
    const typeB = typeof b;
    if (typeA !== typeB) return false;

    // Handle primitive types
    if (typeA !== 'object') return a === b;

    // Handle Date objects
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.isEqual(a[i], b[i])) return false;
      }
      return true;
    }

    // Handle objects
    if (!Array.isArray(a) && !Array.isArray(b)) {
      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
        if (!this.isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
      }

      return true;
    }

    // Different types of objects
    return false;
  },
};
