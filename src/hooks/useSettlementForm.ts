import { useState } from 'react';
import { utilityManager } from '../lib/utils';

/**
 * Hook for managing settlement form state.
 * Handles cutoff date, reference, and auto-settle settings.
 */
export function useSettlementForm () {
  const [cutoffDate, setCutoffDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 4);
    return utilityManager.formatDateForFlatpickr(date);
  });
  const [reference, setReference] = useState('');
  const [isAutoSettled, setIsAutoSettled] = useState(false);

  /**
   * Reset form to default values.
   */
  const resetForm = () => {
    const date = new Date();
    date.setHours(date.getHours() + 4);
    setCutoffDate(utilityManager.formatDateForFlatpickr(date));
    setReference('');
    setIsAutoSettled(false);
  };

  /**
   * Check if form has required values.
   */
  const isFormValid = cutoffDate.length > 0;

  return {
    // State.
    cutoffDate,
    reference,
    isAutoSettled,

    // Actions.
    setCutoffDate,
    setReference,
    setIsAutoSettled,
    resetForm,

    // Computed.
    isFormValid,
  };
}
