declare module 'zzfx' {
  export function zzfx(...p: (number | undefined)[]): unknown;
  export const ZZFX: { volume: number; audioContext: AudioContext; play: (...p: (number | undefined)[]) => unknown };
}
