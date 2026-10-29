import { FC, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { nftManager } from '../lib/nft';
import NFTIcon from './NFTIcon';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useQuery } from '@tanstack/react-query';

interface NFTImageProps {
  tokenAddress: string;
  tokenId: string;
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  className?: string;
  showTokenId?: boolean;
}

const SIZE_CLASSES = {
  thumbnail: 'w-10 h-10',
  small: 'w-20 h-20',
  medium: 'w-48 h-48',
  large: 'w-96 h-96',
};

/**
 * An NFT's image, read from its token URI, with loading and failure states.
 */
export const NFTImage: FC<NFTImageProps> = ({
  tokenAddress,
  tokenId,
  size = 'medium',
  className = '',
  showTokenId = false,
}) => {
  const { chainId } = useCurrentNetwork().network;
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const { data: imageUrl = null, isError, isLoading } = useQuery(
    nftManager.imageQuery({ chainId, tokenAddress, tokenId }),
  );
  const hasError = isError || (imageUrl !== null && failedImageUrl === imageUrl);
  const imageLoaded = imageUrl !== null && loadedImageUrl === imageUrl;

  const handleImageLoad = () => {
    setLoadedImageUrl(imageUrl);
  };

  const handleImageError = () => {
    setFailedImageUrl(imageUrl);
  };

  const sizeClass = SIZE_CLASSES[size];
  const containerClasses = `relative flex items-center justify-center flex-col ${sizeClass} ${className}`;

  return (
    <div className={containerClasses}>
      {isLoading && (
        <div className="flex flex-col items-center justify-center text-text-label">
          <Loader2 className={`${size === 'thumbnail' ? 'size-4' : 'h-8 w-8'} animate-spin ${size === 'thumbnail' ? '' : 'mb-2'}`} />
          {size !== 'thumbnail' && <span className="text-xs">Loading…</span>}
        </div>
      )}

      {!isLoading && hasError && (
        <div className="flex flex-col items-center justify-center text-text-label">
          <NFTIcon
            size={size === 'thumbnail' ? 'sm' : 'lg'}
            className={`${size === 'thumbnail' ? '' : 'mb-2'} ${size === 'thumbnail' ? '' : 'h-8 w-8'}`}
          />
          {size !== 'thumbnail' && <span className="text-xs text-center px-2">No image</span>}
        </div>
      )}

      {!isLoading && !hasError && imageUrl && (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-label">
              <NFTIcon
              className="mb-2"
              size="md" />
              <span className="text-xs">Loading…</span>
            </div>
          )}
          <img
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          alt={`NFT #${tokenId}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          src={imageUrl}/>
          {showTokenId && imageLoaded && (
            <div className="mt-4">
              <span>#{tokenId}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NFTImage;
