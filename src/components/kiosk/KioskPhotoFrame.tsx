import { useGooglePhotos } from '../../hooks/useGooglePhotos';
import { PHOTO_WORKER_URL, PHOTO_SIZE_SUFFIX } from '../../config/photos';

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
