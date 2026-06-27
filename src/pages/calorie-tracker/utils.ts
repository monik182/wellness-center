const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function getToday(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getCurrentTime(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatTime(time24: string): string {
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${suffix}`;
}
