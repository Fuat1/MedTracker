export function parseVoiceQuery(
  query: string,
): { sys?: number; dia?: number; pulse?: number } {
  if (!query || typeof query !== 'string') {
    return {};
  }

  // Decode URL-encoded spaces (+ from query strings)
  const normalized = query.replace(/\+/g, ' ').trim();

  const result: { sys?: number; dia?: number; pulse?: number } = {};

  // Match "120 over 80", "120/80", or "blood pressure 120 80"
  const bpMatch =
    normalized.match(/(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})/i) ??
    normalized.match(/blood\s+pressure\s+(\d{2,3})\s+(\d{2,3})/i);

  if (bpMatch) {
    const sys = parseInt(bpMatch[1], 10);
    const dia = parseInt(bpMatch[2], 10);
    if (sys >= 40 && sys <= 300) {
      result.sys = sys;
    }
    if (dia >= 30 && dia <= 200) {
      result.dia = dia;
    }
  }

  // Match "pulse 72", "heart rate 72", "hr 72"
  const pulseMatch = normalized.match(
    /(?:pulse|heart\s+rate|hr)\s*:?\s*(\d{2,3})/i,
  );
  if (pulseMatch) {
    const pulse = parseInt(pulseMatch[1], 10);
    if (pulse >= 30 && pulse <= 250) {
      result.pulse = pulse;
    }
  }

  return result;
}
