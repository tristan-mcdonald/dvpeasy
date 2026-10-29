import { FC } from 'react';

import NFTImage from './NFTImage';

interface NFTCollectionPreviewProps {
  tokenAddress: string;
  tokenId: string;
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * An NFT collection's image, for the token badges and lists.
 */
export const NFTCollectionPreview: FC<NFTCollectionPreviewProps> = ({
  tokenAddress,
  tokenId,
  size = 'thumbnail',
  className = '',
}) => {
  // A collection has no image of its own, so it's shown by one of its NFTs in the settlement.
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
