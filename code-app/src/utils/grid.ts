/**
 * Placement grid. Purely a visual aid in edit mode — nothing is stored as a
 * grid reference. Assets keep precise percentage coordinates so two machines
 * in the same cell stay distinct.
 */

export const GRID_COLS = 10;   // A..J
export const GRID_ROWS = 6;    // 1..6

/** Grid reference for a position, e.g. "C4". Derived, never stored. */
export function cellRef(planX: number, planY: number): string {
  const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor(planX / (100 / GRID_COLS))));
  const row = Math.min(GRID_ROWS - 1, Math.max(0, Math.floor(planY / (100 / GRID_ROWS))));
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

/** Cell labels and line positions for the overlay, in percentages. */
export function gridCells(): { label: string; left: number; top: number }[] {
  const cells: { label: string; left: number; top: number }[] = [];
  const cw = 100 / GRID_COLS;
  const ch = 100 / GRID_ROWS;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      cells.push({
        label: `${String.fromCharCode(65 + c)}${r + 1}`,
        left: c * cw,
        top: r * ch,
      });
    }
  }
  return cells;
}