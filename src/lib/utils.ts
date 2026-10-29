import React from 'react';

/**
 * Small helpers for text inputs, addresses, dates and comparing values.
 */
export const utilityManager = {
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
   * Props for a controlled text input which trims its value when it loses focus.
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
   * Shortens an address to its first and last `length` characters.
   */
  shortenAddress (address: string, length: number = 6): string {
    if (!address || address.length <= length * 2) return address;
    return `${address.slice(0, length)}…${address.slice(-length)}`;
  },

  /**
   * Formats a date in local time as `Y-m-d H:i`, the format the date picker is set up with.
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
   * Whether two values are deeply equal, comparing dates by their time.
   */
  isEqual (a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (a === undefined || b === undefined) return a === b;

    const typeA = typeof a;
    const typeB = typeof b;
    if (typeA !== typeB) return false;

    if (typeA !== 'object') return a === b;

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.isEqual(a[i], b[i])) return false;
      }
      return true;
    }

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

    // One is an array and the other isn't.
    return false;
  },
};
