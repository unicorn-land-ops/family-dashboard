import { useEffect, useState } from 'react';
import type { PhotoItem } from '../../hooks/useGooglePhotos';
import { ROTATION_INTERVAL_MS } from '../../config/photos';

interface PhotoMetaOverlayProps {
  photo: PhotoItem;
  /** Unique value that changes whenever a new photo becomes active. Used to reset the fade-out timer. */
  photoKey: string | number;
}

function formatMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/**
 * Bottom-right caption card showing "Month Year · Place".
 *
 * Fades in with the photo, stays visible for half of ROTATION_INTERVAL_MS,
 * then fades out over the remaining half so it doesn't compete with the image
 * for the full display duration.
 */
export function PhotoMetaOverlay({ photo, photoKey }: PhotoMetaOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const halfLife = ROTATION_INTERVAL_MS / 2;
    const t = setTimeout(() => setVisible(false), halfLife);
    return () => clearTimeout(t);
  }, [photoKey]);

  const monthYear = formatMonthYear(photo.takenAt);
  const place = photo.place ?? null;

  if (!monthYear && !place) return null;

  return (
    <div className={`photo-meta-overlay ${visible ? 'visible' : 'hidden'}`}>
      {monthYear && <span className="photo-meta-date">{monthYear}</span>}
      {monthYear && place && <span className="photo-meta-sep"> · </span>}
      {place && <span className="photo-meta-place">{place}</span>}
    </div>
  );
}
