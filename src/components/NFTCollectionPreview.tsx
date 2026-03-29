import { FC } from 'react';

import NFTImage from './NFTImage';

interface NFTCollectionPreviewProps {
  tokenAddress: string;
  tokenId: string;
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  className?: string;
}

export const NFTCollectionPreview: FC<NFTCollectionPreviewProps> = ({
  tokenAddress,
  tokenId,
  size = 'thumbnail',
  className = '',
}) => {
  // Use the specific NFT ID that we know exists in the settlement.
  return (
    <div className={className}>
      <NFTImage
        size={size}
        tokenAddress={tokenAddress}
        tokenId={tokenId}
        className="!w-full !h-full object-cover"
      />
    </div>
  );
};

export default NFTCollectionPreview;
