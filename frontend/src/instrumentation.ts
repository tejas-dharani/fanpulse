export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js 25 exposes localStorage globally but its methods are broken stubs.
    // Firebase Auth calls localStorage.getItem during init which crashes SSR.
    // We replace it with a functional in-memory stub so Firebase doesn't crash.
    if (typeof globalThis.localStorage !== "undefined") {
      const store: Record<string, string> = {};
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => { store[k] = v; },
          removeItem: (k: string) => { delete store[k]; },
          clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
          get length() { return Object.keys(store).length; },
          key: (i: number) => Object.keys(store)[i] ?? null,
        },
        writable: true,
        configurable: true,
      });
    }
  }
}
