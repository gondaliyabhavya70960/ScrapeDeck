/**
 * Deterministic, tasteful colour per source key. Hue is hashed from the key so
 * a source always reads the same colour; saturation/lightness are pinned to a
 * restrained band so badges stay cohesive rather than rainbow-loud.
 */
export interface SourceColor {
  /** Soft tinted background for the badge. */
  bg: string;
  /** Readable foreground for text on `bg`. */
  text: string;
  /** Saturated dot/accent. */
  dot: string;
  border: string;
}

function hashHue(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % 360;
  }
  return h;
}

export function sourceColor(key: string): SourceColor {
  const hue = hashHue(key || 'source');
  return {
    bg: `hsl(${hue} 70% 96%)`,
    text: `hsl(${hue} 55% 32%)`,
    dot: `hsl(${hue} 65% 50%)`,
    border: `hsl(${hue} 50% 88%)`,
  };
}
