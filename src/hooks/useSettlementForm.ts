import { useState } from 'react';
import { utilityManager } from '../lib/utils';

/**
 * The create form's settlement fields. The cutoff date starts four hours ahead.
 */
export function useSettlementForm () {
  const [cutoffDate, setCutoffDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 4);
    return utilityManager.formatDateForFlatpickr(date);
  });
  const [reference, setReference] = useState('');
  const [isAutoSettled, setIsAutoSettled] = useState(false);

  const resetForm = () => {
    const date = new Date();
    date.setHours(date.getHours() + 4);
    setCutoffDate(utilityManager.formatDateForFlatpickr(date));
    setReference('');
    setIsAutoSettled(false);
  };

  const isFormValid = cutoffDate.length > 0;

  return {
    cutoffDate,
    reference,
    isAutoSettled,

    setCutoffDate,
    setReference,
    setIsAutoSettled,
    resetForm,

    isFormValid,
  };
}
