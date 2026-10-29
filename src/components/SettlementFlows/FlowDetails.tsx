import Address from '../scaffold-eth/Address';
import LabelWithIcon from '../LabelWithIcon';
import { ArrowDownRight, ArrowUpRight, Coins, Hash, TriangleRight } from 'lucide-react';
import { FlowForDisplay } from '../../types/settlement';
import { ReactNode } from 'react';

interface FlowDetailsProps {
  flow: FlowForDisplay;
  nftActions: ReactNode;
}

/**
 * A flow's sender, recipient, token and amount, or its NFT's ID beside the actions given for it.
 */
export default function FlowDetails ({ flow, nftActions }: FlowDetailsProps) {
  const isNFT = flow.nftId !== undefined;

  return (
    <div className="block w-full space-y-2 pt-4">
      <div className="space-y-1">
        <LabelWithIcon icon={<ArrowUpRight className="size-4" />}>From</LabelWithIcon>
        <Address
        address={flow.from}
        showFull={false} />
      </div>
      <div className="space-y-1">
        <LabelWithIcon icon={<ArrowDownRight className="size-4" />}>To</LabelWithIcon>
        <Address
        address={flow.to}
        showFull={false} />
      </div>
      <div className="space-y-1">
        <LabelWithIcon icon={<Coins className="size-4" />}>Token</LabelWithIcon>
        <Address
        address={flow.token}
        showFull={false} />
      </div>
      <div className="space-y-1">
        <LabelWithIcon icon={isNFT ? <Hash className="size-4" /> : <TriangleRight className="size-4" />}>
          {isNFT ? 'NFT ID' : 'Amount'}
        </LabelWithIcon>
        {isNFT ? (
          <div className="flex flex-auto items-center justify-between gap-2 w-full font-mono">
            <span className="wrap-anywhere">{flow.amount}</span>
            <div className="flex items-center gap-1">
              {nftActions}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono">{flow.amount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
