import flatpickr from 'flatpickr';
import { useEffect, useRef } from 'react';

type Props = {
  cutoffDate: string;
  setCutoffDate: (iso: string) => void;
  shadow?: boolean;
};

export function DatePicker ({ cutoffDate, setCutoffDate, shadow }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const datePicker = flatpickr(ref.current, {
      enableTime: true,
      time_24hr: true,
      dateFormat: 'Y-m-d H:i',
      defaultDate: cutoffDate,
      onChange: ([date]) => {
        // Handle case where date is undefined (when clearing the input).
        if (date) {
          setCutoffDate(datePicker.formatDate(date, 'Y-m-d H:i'));
        } else {
          // Set a default date 4 hours from now if cleared.
          const defaultDate = new Date();
          defaultDate.setHours(defaultDate.getHours() + 4);
          const formattedDate = datePicker.formatDate(defaultDate, 'Y-m-d H:i');
          setCutoffDate(formattedDate);
        }
      },
    });

    if (datePicker.calendarContainer) {
      datePicker.calendarContainer.classList.add('flyonui-datepicker');
      datePicker.calendarContainer.classList.add('dark');
    }
    return () => datePicker.destroy();
  }, [cutoffDate, setCutoffDate]);

  return (
    <input
    className={`input-standard${shadow ? ' shadow-standard' : ''}`}
    placeholder="Select date and time"
    readOnly
    ref={ref}/>
  );
}
