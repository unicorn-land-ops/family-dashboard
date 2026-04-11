import { useGooglePhotos } from '../../hooks/useGooglePhotos';
import { PHOTO_WORKER_URL, PHOTO_SIZE_SUFFIX } from '../../config/photos';
import { PhotoMetaOverlay } from './PhotoMetaOverlay';

interface KioskPhotoFrameProps {
  workerUrl?: string;
}

export function KioskPhotoFrame({ workerUrl = PHOTO_WORKER_URL }: KioskPhotoFrameProps) {
  const { photos, currentIndex, nextIndex, isTransitioning } = useGooglePhotos(workerUrl);

  if (photos.length === 0) {
    return <div className="photo-frame" />;
  }

  const currentPhoto = photos[currentIndex];
  const nextPhoto = photos[nextIndex];

  // The "live" photo whose caption should be displayed is the one currently fully visible.
  // During a crossfade, the `next` photo is the one becoming active.
  const livePhoto = isTransitioning ? nextPhoto : currentPhoto;
  const liveIndex = isTransitioning ? nextIndex : currentIndex;

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
      <PhotoMetaOverlay photo={livePhoto} photoKey={liveIndex} />
    </div>
  );
}
