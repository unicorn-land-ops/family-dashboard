import { useState } from 'react';
import type { PhotoItem } from '../../hooks/useGooglePhotos';
import { PHOTO_SIZE_SUFFIX } from '../../config/photos';

/**
 * One photo filling a rotating-stage slot. Landscape photos with enough pixels fill the slot (cover,
 * biased upward where faces usually are); portrait or low-resolution ones are shown whole (contain) over a
 * blurred copy of themselves, so nobody's head is cut off and small old photos aren't blown up.
 * The blur is a 32 px thumbnail stretched by the browser: free, no CSS filter for the Pi to repaint.
 * Orientation comes from the loaded image (the browser applies EXIF), not the worker's width/height.
 */
export function KioskPhoto({ photo }: { photo?: PhotoItem }) {
  const [fit, setFit] = useState<Record<string, 'cover' | 'contain'>>({});
  if (!photo) return <div className="kd-photo" />;
  const mode = fit[photo.url] ?? 'contain';
  const taken = photo.takenAt ? new Date(photo.takenAt) : null;
  const caption = [
    taken && !Number.isNaN(taken.getTime()) ? taken.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null,
    photo.place,
  ].filter(Boolean).join(' · ');

  return (
    <div className={`kd-photo is-${mode}`}>
      {mode === 'contain' && <img className="kd-photo-bg" src={`${photo.url}=w32-h32`} alt="" aria-hidden="true" />}
      <img
        className="kd-photo-img"
        src={`${photo.url}${PHOTO_SIZE_SUFFIX}`}
        alt=""
        draggable={false}
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          setFit((f) => ({ ...f, [photo.url]: w > h && w >= 900 ? 'cover' : 'contain' }));
        }}
      />
      {caption && <span className="kd-photo-cap">{caption}</span>}
    </div>
  );
}
