export function parseLocalToUtc(localTimeStr: string, timezone: string): Date {
  const [datePart, timePart] = localTimeStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);

  const nominalUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const nominalDate = new Date(nominalUtc);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(nominalDate);
  const partValues: any = {};
  parts.forEach(p => partValues[p.type] = p.value);

  const formattedUtc = Date.UTC(
    Number(partValues.year),
    Number(partValues.month) - 1,
    Number(partValues.day),
    Number(partValues.hour),
    Number(partValues.minute),
    Number(partValues.second)
  );

  const offsetMs = formattedUtc - nominalUtc;
  return new Date(nominalUtc - offsetMs);
}

export function getLocalDayBoundsInUtc(dateStr: string, timezone: string): { startUtc: Date; endUtc: Date } {
  const utcDate = new Date(`${dateStr}T00:00:00.000Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(utcDate);
  const partValues: any = {};
  parts.forEach(p => partValues[p.type] = p.value);

  const formattedUtcTime = Date.UTC(
    Number(partValues.year),
    Number(partValues.month) - 1,
    Number(partValues.day),
    Number(partValues.hour),
    Number(partValues.minute),
    Number(partValues.second)
  );

  const offsetMs = formattedUtcTime - utcDate.getTime();
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetMidnightLocalUtc = Date.UTC(y, m - 1, d, 0, 0, 0);

  const startUtc = new Date(targetMidnightLocalUtc - offsetMs);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startUtc, endUtc };
}

export function getLocalDateStr(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}
