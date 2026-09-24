import type { Asset } from '../types';
import { GRID_COLS, GRID_ROWS, gridCells } from '../utils/grid';

type Props = {
  planUrl: string;
  assets: Asset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Edit mode shows the grid and turns the plan into a click target. */
  editMode?: boolean;
  /** Called with percentage coordinates when the plan is clicked in edit mode. */
  onPlace?: (planX: number, planY: number) => void;
  /** The asset waiting to be placed, if any. */
  pendingAssetName?: string;
  /** In edit mode, clicking an already-placed marker selects it to be moved. */
  onPickForMove?: (id: string) => void;
};

function colourFor(openCount: number) {
  if (openCount === 0) return { fill: '#16A34A', ring: '#DCFCE7' };  // green
  if (openCount <= 2)  return { fill: '#F59E0B', ring: '#FEF3C7' };  // amber
  return { fill: '#DC2626', ring: '#FEE2E2' };                        // red
}

export function FloorPlan({
  planUrl, assets, selectedId, onSelect,
  editMode = false, onPlace, pendingAssetName, onPickForMove,
}: Props) {
  // percentage of the plan, derived from where inside the element the click landed
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editMode || !onPlace) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100;
    const y = ((e.clientY - box.top) / box.height) * 100;
    onPlace(x, y);
  }

  function handleMarkerClick(e: React.MouseEvent, assetId: string) {
   e.stopPropagation();
   if (editMode && onPickForMove) {
     // First click on a placed marker in edit mode: pick it up to move.
     // The next click on empty plan space commits the new position.
     onPickForMove(assetId);
   } else {
     onSelect(assetId);
   }
 }

  const placed = assets.filter(a => a.planX !== null && a.planY !== null);

  return (
    <div
      onClick={handleClick}
      className={[
        'relative aspect-1000/600 w-full outline-offset-2',
        editMode && pendingAssetName ? 'cursor-crosshair' : 'cursor-default',
        editMode ? 'outline-2 outline-dashed outline-[#6D28D9]' : 'outline-none',
      ].join(' ')}
    >
      <img
        src={planUrl}
        alt=""
        className="block h-full w-full"
      />

      {editMode && (
        <svg
          viewBox={`0 0 ${GRID_COLS * 100} ${GRID_ROWS * 100}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {Array.from({ length: GRID_COLS - 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(i + 1) * 100} y1={0}
              x2={(i + 1) * 100} y2={GRID_ROWS * 100}
              stroke="#6D28D9" strokeOpacity={0.18} strokeWidth={1.5}
            />
          ))}
          {Array.from({ length: GRID_ROWS - 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0} y1={(i + 1) * 100}
              x2={GRID_COLS * 100} y2={(i + 1) * 100}
              stroke="#6D28D9" strokeOpacity={0.18} strokeWidth={1.5}
            />
          ))}
          {gridCells().map(c => (
            <text
              key={c.label}
              x={(c.left / 100) * GRID_COLS * 100 + 8}
              y={(c.top / 100) * GRID_ROWS * 100 + 20}
              fontSize={16}
              fontFamily="system-ui, sans-serif"
              fill="#6D28D9"
              fillOpacity={0.3}
            >
              {c.label}
            </text>
          ))}
        </svg>
      )}

      {placed.map(a => {
        const c = colourFor(a.openCount);
        const on = a.id === selectedId;
        return (
          <button
            key={a.id}
            onClick={e => handleMarkerClick(e, a.id)}
            aria-label={`${a.name}, ${a.openCount} open requests`}
            title={editMode ? `${a.name} — click, then click a new spot to move it` : `${a.name} — ${a.openCount} open`}
            className={[
              'absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-[3px] p-0',
              'transition-[width,height] duration-120',
              on ? 'size-7' : 'size-5',
              on && editMode ? 'shadow-[0_0_0_4px_rgba(109,40,217,0.35)]' : '',
            ].join(' ')}
            // Position and colour come from Dataverse at runtime, so they stay
            // inline — Tailwind only generates classes it can see at build time.
            style={{
              left: `${a.planX}%`,
              top: `${a.planY}%`,
              background: c.fill,
              borderColor: on ? '#1F2937' : c.ring,
            }}
          />
        );
      })}

      {editMode && pendingAssetName && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-[#6D28D9] px-3 py-1.5 text-[13px] font-bold text-white">
          Click to place: {pendingAssetName}
        </div>
      )}
    </div>
  );
}