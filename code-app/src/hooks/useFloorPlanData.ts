import { useCallback, useEffect, useState } from 'react';
import type { Site, Asset, MaintenanceRequest } from '../types';
import type { Nvm_assetsBase } from '../generated/models/Nvm_assetsModel';

// Replace all three with the real generated names from src/generated/services
import { Nvm_sitesService } from '../generated/services/Nvm_sitesService';
import { Nvm_assetsService } from '../generated/services/Nvm_assetsService';
import { Nvm_maintenancerequestsService } from '../generated/services/Nvm_maintenancerequestsService';

/** Dataverse suffix for human-readable labels on choices, lookups and currency. */
const FV = '@OData.Community.Display.V1.FormattedValue';

/** Fallback if formatted values don't arrive alongside select. */
const STATUS_LABEL: Record<number, string> = {
  1: 'New', 2: 'Triaged', 3: 'Assigned',
  4: 'In Progress', 5: 'Complete', 6: 'Cancelled',
};

const OPEN = new Set(['New', 'Triaged', 'Assigned', 'In Progress']);

export function useFloorPlanData() {
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [s, a, r] = await Promise.all([
          Nvm_sitesService.getAll({
            select: ['nvm_siteid', 'nvm_sitename'],
            orderBy: ['nvm_sitename asc'],
          }),
          Nvm_assetsService.getAll({
            select: [
              'nvm_assetid', 'nvm_assetname', 'nvm_assettag',
              '_nvm_site_value', 'nvm_criticality',
              'nvm_planx', 'nvm_plany',
            ],
            orderBy: ['nvm_assetname asc'],
          }),
          Nvm_maintenancerequestsService.getAll({
            select: [
              'nvm_maintenancerequestid', 'nvm_requestreference',
              '_nvm_asset_value', 'nvm_status', 'nvm_priority',
              'nvm_reportedon', 'nvm_downtimehours',
            ],
            orderBy: ['nvm_reportedon desc'],
          }),
        ]);

        if (cancelled) return;

        const siteRows: Site[] = (s.data ?? []).map((x: any) => ({
          id: x.nvm_siteid,
          name: x.nvm_sitename,
        }));

        const reqRows: MaintenanceRequest[] = (r.data ?? []).map((x: any) => ({
          id: x.nvm_maintenancerequestid,
          reference: x.nvm_requestreference,
          assetId: x._nvm_asset_value,
          status: x[`nvm_status${FV}`] ?? STATUS_LABEL[x.nvm_status],
          priority: x[`nvm_priority${FV}`],
          reportedOn: x.nvm_reportedon,
          downtime: x.nvm_downtimehours,
        }));

        // open requests per asset — drives the marker colours
        const openByAsset = new Map<string, number>();
        for (const req of reqRows) {
          if (req.status && OPEN.has(req.status)) {
            openByAsset.set(req.assetId, (openByAsset.get(req.assetId) ?? 0) + 1);
          }
        }

        const assetRows: Asset[] = (a.data ?? []).map((x: any) => ({
          id: x.nvm_assetid,
          name: x.nvm_assetname,
          tag: x.nvm_assettag,
          siteId: x._nvm_site_value,
          criticality: x[`nvm_criticality${FV}`],
          planX: x.nvm_planx ?? null,
          planY: x.nvm_plany ?? null,
          openCount: openByAsset.get(x.nvm_assetid) ?? 0,
        }));

        setSites(siteRows);
        setAssets(assetRows);
        setRequests(reqRows);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load plant data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  /**
   * Write a new position for an asset. Plan X and Plan Y are whole number
   * columns, so this avoids the lookup-write problem entirely.
   * Updates local state first so the marker moves immediately, and rolls
   * back if Dataverse rejects the write.
   */
  const placeAsset = useCallback(
    async (assetId: string, planX: number, planY: number) => {
      const x = Math.round(Math.min(100, Math.max(0, planX)) * 10) / 10;
      const y = Math.round(Math.min(100, Math.max(0, planY)) * 10) / 10;

      let previous: Asset | undefined;
      setAssets(curr =>
        curr.map(a => {
          if (a.id !== assetId) return a;
          previous = a;
          return { ...a, planX: x, planY: y };
        }),
      );

      setSaving(true);
      try {
        await Nvm_assetsService.update(assetId, { nvm_planx: x, nvm_plany: y });
        setError(undefined);
      } catch (e: unknown) {
        // roll back the optimistic change
        if (previous) {
          const snapshot = previous;
          setAssets(curr => curr.map(a => (a.id === assetId ? snapshot : a)));
        }
        setError(e instanceof Error ? e.message : 'Could not save the new position');
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  /** Clear a placement so the asset returns to the unplaced list. */
  const clearAsset = useCallback(async (assetId: string) => {
    let previous: Asset | undefined;
    setAssets(curr =>
      curr.map(a => {
        if (a.id !== assetId) return a;
        previous = a;
        return { ...a, planX: null, planY: null };
      }),
    );

    setSaving(true);
    try {
      await Nvm_assetsService.update(
        assetId,
        { nvm_planx: null, nvm_plany: null } as unknown as Partial<Omit<Nvm_assetsBase, 'nvm_assetid'>>,
      );
      setError(undefined);
    } catch (e: unknown) {
      if (previous) {
        const snapshot = previous;
        setAssets(curr => curr.map(a => (a.id === assetId ? snapshot : a)));
      }
      setError(e instanceof Error ? e.message : 'Could not clear the position');
    } finally {
      setSaving(false);
    }
  }, []);

  return { sites, assets, requests, loading, error, saving, placeAsset, clearAsset };
}