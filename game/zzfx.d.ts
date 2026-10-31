declare module 'zzfx' {
  export function zzfx(...p: (number | undefined)[]): unknown;
  export const ZZFX: { volume: number; sampleRate: number; audioContext: AudioContext; play: (...p: (number | undefined)[]) => unknown; buildSamples: (...p: number[]) => number[] };
}
