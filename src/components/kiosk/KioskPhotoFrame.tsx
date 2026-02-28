import { useGooglePhotos } from '../../hooks/useGooglePhotos';
import { PHOTO_WORKER_URL, PHOTO_SIZE_SUFFIX } from '../../config/photos';

interface KioskPhotoFrameProps {
  /** Worker URL to fetch photos from. Defaults to PHOTO_WORKER_URL env var. */
  workerUrl?: string;
}

/**
 * Two-layer crossfade photo frame with Ken Burns pan/zoom animation.
 *
 * Displays family photos from Google Photos via the Cloudflare Worker proxy.
 * Photos crossfade every 12 minutes with a subtle 5% scale Ken Burns effect.
 *
 * Renders an empty placeholder if no photos are available (never crashes).
 * Must be placed inside a sized container — uses width/height 100%.
 *
 * NOTE: This component is intentionally NOT imported by any layout component yet.
 * Integration happens in Phase 3 (LAY-01) when the 2-column bottom grid is built.
 */
export function KioskPhotoFrame({ workerUrl = PHOTO_WORKER_URL }: KioskPhotoFrameProps) {
  const { photos, currentIndex, nextIndex, isTransitioning } = useGooglePhotos(workerUrl);

  // Empty placeholder — shows background color while loading or if no photos
  if (photos.length === 0) {
    return <div className="photo-frame" />;
  }

  const currentPhoto = photos[currentIndex];
  const nextPhoto = photos[nextIndex];

  // Alternate Ken Burns direction on every other photo
  const kenburnsVariant = currentIndex % 2 === 0 ? 'kenburns-a' : 'kenburns-b';

  return (
    <div className="photo-frame">
      {/* Layer 1: current photo — fades out when transitioning */}
      <img
        className={`photo-img ${isTransitioning ? 'inactive' : 'active'} ${kenburnsVariant}`}
        src={`${currentPhoto.url}${PHOTO_SIZE_SUFFIX}`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      {/* Layer 2: next photo — fades in when transitioning */}
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
