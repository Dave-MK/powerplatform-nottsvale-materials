import { useMemo, useState } from "react";
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { FloorPlan } from "./components/FloorPlan";
import { PLAN_BY_SITE } from "./utils/planMap";
import { cellRef } from "./utils/grid";

export default function App() {
  const { sites, assets, requests, loading, saving, error, placeAsset, clearAsset } = useFloorPlanData();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const activeSite = sites.find((s) => s.id === siteId) ?? sites[0];
  const planUrl = activeSite ? PLAN_BY_SITE[activeSite.name] : undefined;

  const siteAssets = useMemo(
    () => assets.filter((a) => a.siteId === activeSite?.id),
    [assets, activeSite?.id],
  );

  const unplaced = useMemo(
    () => siteAssets.filter((a) => a.planX === null || a.planY === null),
    [siteAssets],
  );

  const selected = siteAssets.find((a) => a.id === assetId) ?? null;
  const pending = siteAssets.find((a) => a.id === pendingId) ?? null;

  const selectedRequests = useMemo(
    () => requests.filter((r) => r.assetId === assetId),
    [requests, assetId],
  );

  function handlePlace(x: number, y: number) {
    if (!pendingId) return;
    void placeAsset(pendingId, x, y);
    setAssetId(pendingId);
    setPendingId(null);
  }

  function handlePickForMove(id: string) {
    setPendingId(id);
    setAssetId(id);
  }

  if (loading) return <p className="p-6 text-sm font-medium text-slate-600">Loading plant data…</p>;
  if (error && assets.length === 0) {
    return <p className="p-6 text-sm font-medium text-red-700" role="alert">{String(error)}</p>;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 p-3 text-slate-900 md:p-5">
      <div className="mx-auto grid h-full w-full max-w-[1600px] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {sites.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSiteId(s.id);
                  setAssetId(null);
                  setPendingId(null);
                }}
                className={[
                  "rounded-md px-3.5 py-2 text-sm transition",
                  s.id === activeSite?.id
                    ? "bg-slate-900 font-semibold text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {s.name}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setEditMode((v) => !v);
                setPendingId(null);
              }}
              className={[
                "ml-auto rounded-md px-3.5 py-2 text-sm font-semibold transition",
                editMode ? "bg-violet-600 text-white hover:bg-violet-500" : "bg-slate-100 text-slate-800 hover:bg-slate-200",
              ].join(" ")}
            >
              {editMode ? "Done placing" : "Place assets"}
            </button>

            {saving && <span className="text-xs font-medium text-slate-500">Saving…</span>}
          </div>

          {error && assets.length > 0 && (
            <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {String(error)}
            </p>
          )}

          {planUrl && (
            <FloorPlan
              planUrl={planUrl}
              assets={siteAssets}
              selectedId={editMode ? pendingId : assetId}
              onSelect={setAssetId}
              editMode={editMode}
              onPlace={handlePlace}
              onPickForMove={handlePickForMove}
              pendingAssetName={pending?.name}
            />
          )}
        </div>

        <aside className="h-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          {editMode ? (
            <>
              <h2 className="mb-1 text-lg font-semibold text-slate-900">Place assets</h2>
              <p className="mb-4 text-xs text-slate-500">
                Pick an asset, then click its position on the plan.
              </p>

              {unplaced.length > 0 && (
                <>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                    Not yet placed ({unplaced.length})
                  </h3>
                  <ul className="mb-5 mt-2 space-y-2">
                    {unplaced.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => setPendingId(a.id)}
                          className={[
                            "block w-full rounded-md border px-2.5 py-2 text-left text-sm transition",
                            a.id === pendingId
                              ? "border-violet-600 bg-violet-600 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {a.name}
                          <span className="mt-1 block text-[11px] opacity-80">{a.tag}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Placed ({siteAssets.length - unplaced.length})
              </h3>
              <ul className="mt-2 space-y-2">
                {siteAssets
                  .filter((a) => a.planX !== null && a.planY !== null)
                  .map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 border-t border-slate-200 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => setPendingId(a.id)}
                        className={[
                          "flex-1 rounded px-2 py-1 text-left text-sm",
                          a.id === pendingId ? "bg-violet-600 text-white" : "text-slate-900",
                        ].join(" ")}
                      >
                        {a.name}
                        <span className="opacity-70">
                          {' '}· {cellRef(a.planX as number, a.planY as number)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void clearAsset(a.id)}
                        title="Remove from plan"
                        className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-200"
                      >
                        Clear
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <>
              {!selected && <p className="text-sm text-slate-500">Select an asset on the plan.</p>}

              {selected && (
                <>
                  <h2 className="mb-1 text-xl font-semibold text-slate-900">{selected.name}</h2>
                  <p className="mb-4 text-sm text-slate-500">
                    {selected.tag} · {selected.criticality}
                    {selected.planX !== null && selected.planY !== null && (
                      <> · grid {cellRef(selected.planX, selected.planY)}</>
                    )}
                  </p>

                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Open requests ({selected.openCount})
                  </h3>

                  {selectedRequests.length === 0 && <p className="mt-2 text-sm text-slate-500">No requests on record.</p>}

                  <ul className="mt-2 space-y-2">
                    {selectedRequests.map((r) => (
                      <li key={r.id} className="border-t border-slate-200 py-2.5">
                        <strong className="text-sm text-slate-900">{r.reference}</strong> — {r.status}
                        <div className="text-xs text-slate-500">
                          {r.priority} · {r.downtime ?? 0} h downtime
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
