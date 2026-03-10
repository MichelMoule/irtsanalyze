/// <reference types="vite/client" />

declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
  }
  function confetti(options?: Options): void;
  export default confetti;
}
