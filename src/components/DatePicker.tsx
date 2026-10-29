import flatpickr from 'flatpickr';
import { useEffect, useRef } from 'react';

type Props = {
  cutoffDate: string;
  setCutoffDate: (iso: string) => void;
  shadow?: boolean;
};

/**
 * The cutoff date's field, with Flatpickr's calendar, in the `Y-m-d H:i` format the form keeps.
 */
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
        if (date) {
          setCutoffDate(datePicker.formatDate(date, 'Y-m-d H:i'));
        } else {
          // A cleared field goes back to four hours from now, as on a new form.
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
