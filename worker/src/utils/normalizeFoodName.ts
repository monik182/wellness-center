export function normalizeFoodName(name: string): string {
  return name
    .replace(/^\d+\s+/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b(\w{5,})s\b/g, "$1");
}
