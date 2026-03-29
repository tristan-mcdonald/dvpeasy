import { utilityManager } from '../../lib/utils';
import { DatePicker } from '../DatePicker';

interface SettlementDetailsFormProps {
  cutoffDate: string;
  setCutoffDate: (date: string) => void;
  reference: string;
  setReference: (reference: string) => void;
  isAutoSettled: boolean;
  setIsAutoSettled: (isAutoSettled: boolean) => void;
}

export default function SettlementDetailsForm ({
  cutoffDate,
  setCutoffDate,
  reference,
  setReference,
  isAutoSettled,
  setIsAutoSettled,
}: SettlementDetailsFormProps) {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-6 border-t border-interface-border mt-14 mx-auto max-w-5xl pt-10">
        <div>
          <label className="block label mb-2">Cutoff date</label>
          <DatePicker
          cutoffDate={cutoffDate}
          setCutoffDate={setCutoffDate}
          shadow />
        </div>

        <div>
          <label className="block label mb-2" htmlFor='settlementReference'>Settlement reference</label>
          <input
          className="shadow-standard input-standard"
          {...utilityManager.createTrimmedInputProps(reference, setReference)}
          placeholder="Optional reference for this settlement"
          id="settlementReference"
          name='settlementReference'
          type="text" />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8 mx-auto max-w-5xl">
        <input
        checked={isAutoSettled}
        className="switch switch-primary"
        id="autoSettled"
        onChange={(event) => setIsAutoSettled(event.target.checked)}
        type="checkbox"/>
        <label
        className="cursor-pointer"
        htmlFor="autoSettled">Auto-settle when all parties approve</label>
      </div>
    </>
  );
}
