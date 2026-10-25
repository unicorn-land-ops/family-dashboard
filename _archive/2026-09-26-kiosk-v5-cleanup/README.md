# Archive — kiosk v5 cleanup (2026-09-26)

Files removed from the live source tree during the 2026-09-26 structural refresh.
Nothing here is imported by the app; the build does not reference these files.

## Why they were archived

The kiosk v5 "Focus" redesign (docs/plans/2026-04-03-kiosk-v5-focus.md) replaced the
rotating two-page stage (`KioskPageA` / `KioskPageB` inside `KioskRotatingStage`) with a
single fixed-grid `KioskDashboard`. The implementation landed, but the superseded
files were left behind in `src/`:

| File (original path) | Reason |
|---|---|
| `src/components/kiosk/KioskPageA.tsx` → `kiosk-KioskPageA.tsx` | Pre-v5 "Life Stuff" rotating page. Not imported since v5. |
| `src/components/kiosk/KioskPageB.tsx` → `kiosk-KioskPageB.tsx` | Pre-v5 "World Stuff" rotating page. Not imported since v5. |
| `src/components/kiosk/KioskRotatingStage.tsx` → `kiosk-KioskRotatingStage.tsx` | Pre-v5 stage shell that hosted PageA/PageB. Not imported since v5. |
| `src/hooks/useStageRotation.ts` → `hooks-useStageRotation.ts` | Timer hook used only by `KioskRotatingStage`. |
| `index.old.html` → `index.old.html` | Stale pre-Vite entry page (Feb 2026). Vite builds from `index.html`. |

## How to restore

Move a file back to its original path (see table). No other changes are needed —
but note the restored component will not render anywhere until something imports it.

## Verification done before archiving (2026-09-26)

- `src/App.tsx` and `src/components/kiosk/KioskDashboard.tsx` import graphs fully
  traced: neither references these files.
- The only test file (`src/lib/countdowns.test.ts`) does not reference them.
- `useInterval.ts` was deliberately left in `src/hooks/`: it is still used by the
  live sidebar rotation (`useContentRotation`).
