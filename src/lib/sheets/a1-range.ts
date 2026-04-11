const ASCII_A = 65;
const ALPHABET_SIZE = 26;

function toColumnLabel(columnNumber: number) {
  let remaining = columnNumber;
  let label = "";

  while (remaining > 0) {
    const modulo = (remaining - 1) % ALPHABET_SIZE;
    label = String.fromCharCode(ASCII_A + modulo) + label;
    remaining = Math.floor((remaining - 1) / ALPHABET_SIZE);
  }

  return label;
}

export function buildHeaderRange(sheetName: string, headerCount: number) {
  const endColumn = toColumnLabel(Math.max(headerCount, 1));
  return `${sheetName}!A1:${endColumn}1`;
}
