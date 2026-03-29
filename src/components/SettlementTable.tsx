import SettlementRow from './SettlementRow';
import { Settlement } from '../types/settlement';
import { SettlementWithFlows } from '../hooks/useSettlementsWithFlows';

interface SettlementTableProps {
  settlements: (Settlement | SettlementWithFlows)[];
}

export default function SettlementTable ({ settlements }: SettlementTableProps) {
  return (
    <div className='min-w-0 w-full overflow-x-auto h-fit shadow-standard rounded-lg border border-interface-border bg-card-background p-4'>
      <table
      className='min-w-[640px] table table-sm table-borderless'
      data-testid='settlement-table'>
        <thead>
          <tr>
            <th className="label normal-case w-[5%]">ID</th>
            <th className="label normal-case w-[35%]">Reference</th>
            <th className="label normal-case w-[20%]">Tokens</th>
            <th className="label normal-case w-[20%]">Status</th>
            <th className="label normal-case w-[20%]">Cutoff date</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map((settlement) => (
            <SettlementRow
            key={settlement.id}
            settlement={settlement} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
