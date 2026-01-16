export type CsvLiteParseResult = {
  headers: string[];
  rows: Record<string, string>[];
};

const normalize = (value: string) => value.replace(/^\uFEFF/, '').trim();

const detectDelimiter = (headerLine: string): string => {
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = -1;
  for (const c of candidates) {
    const count = headerLine.split(c).length - 1;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
};

const parseCsvLine = (line: string, delimiter: string): string[] => {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      out.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  out.push(current);
  return out.map(v => normalize(v));
};

export const csvLite = {
  async parse(file: File): Promise<CsvLiteParseResult> {
    const text = await file.text();
    const lines = text
      .split(/\r\n|\n|\r/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter).map(h => normalize(h));

    const rows = lines.slice(1).map(line => {
      const cells = parseCsvLine(line, delimiter);
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h] = cells[idx] ?? '';
      });
      return record;
    });

    return { headers, rows };
  }
};
