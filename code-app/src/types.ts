export type Site = {
  id: string;
  name: string;
};

export type Asset = {
  id: string;
  name: string;
  tag: string;
  siteId: string;
  criticality?: string;
  /** null until an admin places the asset on the plan */
  planX: number | null;
  planY: number | null;
  openCount: number;
};

export type MaintenanceRequest = {
  id: string;
  reference: string;
  assetId: string;
  status?: string;
  priority?: string;
  reportedOn?: string;
  downtime?: number;
};