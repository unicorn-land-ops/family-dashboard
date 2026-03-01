import { useEffect } from 'react';
import { useGooglePhotos } from '../../hooks/useGooglePhotos';
import { PHOTO_WORKER_URL, PHOTO_SIZE_SUFFIX } from '../../config/photos';

export type PhotoOrientation = 'portrait' | 'landscape';

interface KioskPhotoFrameProps {
  workerUrl?: string;
  onOrientationChange?: (orientation: PhotoOrientation) => void;
}

export function KioskPhotoFrame({ workerUrl = PHOTO_WORKER_URL, onOrientationChange }: KioskPhotoFrameProps) {
  const { photos, currentIndex, nextIndex, isTransitioning } = useGooglePhotos(workerUrl);

  const currentPhoto = photos[currentIndex];

  // Report orientation when current photo changes
  useEffect(() => {
    if (!currentPhoto || !onOrientationChange) return;
    const orientation: PhotoOrientation = currentPhoto.width > currentPhoto.height ? 'landscape' : 'portrait';
    onOrientationChange(orientation);
  }, [currentIndex, currentPhoto, onOrientationChange]);

  if (photos.length === 0) {
    return <div className="photo-frame" />;
  }

  const nextPhoto = photos[nextIndex];

  return (
    <div className="photo-frame">
      <img
        className={`photo-img ${isTransitioning ? 'inactive' : 'active'}`}
        src={`${currentPhoto.url}${PHOTO_SIZE_SUFFIX}`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className={`photo-img ${isTransitioning ? 'active' : 'inactive'}`}
        src={`${nextPhoto.url}${PHOTO_SIZE_SUFFIX}`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </div>
  );
}
