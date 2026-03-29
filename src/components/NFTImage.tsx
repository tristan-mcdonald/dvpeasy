import { FC, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { logger } from '../lib/logger';
import { nftManager } from '../lib/nft';
import NFTIcon from './NFTIcon';

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

export const NFTImage: FC<NFTImageProps> = ({
  tokenAddress,
  tokenId,
  size = 'medium',
  className = '',
  showTokenId = false,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const loadNFTImage = async () => {
      if (!tokenAddress || !tokenId) {
        return;
      }

      setIsLoading(true);
      setHasError(false);
      setImageLoaded(false);
      setImageUrl(null);

      try {
        const url = await nftManager.fetchNFTImage(tokenAddress, tokenId);

        if (url) {
          // Preload the image to check if it's accessible.
          const canLoad = await nftManager.preloadImage(url);

          if (canLoad) {
            setImageUrl(url);
          } else {
            setHasError(true);
          }
        } else {
          setHasError(true);
        }
      } catch (error) {
        logger.warn('Failed to load NFT image:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTImage();
  }, [tokenAddress, tokenId]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);
    setImageLoaded(false);
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
