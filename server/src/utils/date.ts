export function parseFinancialDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [_, y, m, d] = isoMatch;
    const date = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)));
    if (!isNaN(date.getTime())) return date;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (or 2-digit year)
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmyMatch) {
    const [_, d, m, rawY] = dmyMatch;
    const fullYear = rawY.length === 2 ? parseInt(`20${rawY}`, 10) : parseInt(rawY, 10);
    const date = new Date(Date.UTC(fullYear, parseInt(m, 10) - 1, parseInt(d, 10)));
    if (!isNaN(date.getTime())) return date;
  }

  // DD MMM YYYY (e.g. 15 Jan 2024 or 15-Jan-2024 or 15 Jan 24)
  const dMmmYMatch = clean.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})/);
  if (dMmmYMatch) {
    const [_, d, monStr, rawY] = dMmmYMatch;
    const months: { [k: string]: number } = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const m = months[monStr.toLowerCase().substring(0, 3)];
    if (m !== undefined) {
      const fullYear = rawY.length === 2 ? parseInt(`20${rawY}`, 10) : parseInt(rawY, 10);
      const date = new Date(Date.UTC(fullYear, m, parseInt(d, 10)));
      if (!isNaN(date.getTime())) return date;
    }
  }

  const fallback = new Date(clean);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function getMonthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
