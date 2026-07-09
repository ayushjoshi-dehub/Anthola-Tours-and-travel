function escapeCsv(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function toCsv(rows, headers) {
  const headerLine = headers.map((h) => escapeCsv(h.label || h.key)).join(',');
  const lines = rows.map((row) => headers.map((h) => escapeCsv(typeof h.value === 'function' ? h.value(row) : row[h.key])).join(','));
  return [headerLine, ...lines].join('\n');
}

module.exports = { escapeCsv, toCsv };
