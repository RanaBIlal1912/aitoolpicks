// The one place the visitor's display currency lives. Every component reads it through CurrencyProvider (useSyncExternalStore), so there is no
// per-component currency state to drift out of step. The store is framework-free so tests/currency-sync.test.ts can exercise it directly.
import { isCurrency, type CurrencyCode } from "./currency";

export const PICK_KEY = "aitp_currency_v2";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type Listener = () => void;

export function createCurrencyStore(getStorage: () => StorageLike | null) {
  let current: CurrencyCode = "USD";
  const listeners = new Set<Listener>();

  const read = (): string | null => {
    try {
      return getStorage()?.getItem(PICK_KEY) ?? null;
    } catch {
      return null;
    }
  };
  const write = (c: CurrencyCode) => {
    try {
      getStorage()?.setItem(PICK_KEY, c);
    } catch {
      /* storage blocked: the choice still applies for this visit */
    }
  };
  const update = (c: CurrencyCode) => {
    if (c === current) return;
    current = c;
    listeners.forEach((l) => l());
  };

  return {
    getSnapshot: (): CurrencyCode => current,
    /** What the server and the first client render use, so hydration always matches. */
    getServerSnapshot: (): CurrencyCode => "USD",
    subscribe(l: Listener): () => void {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    /** Called once on the client: the saved choice wins, otherwise the default for the visitor's region. */
    init(defaultCurrency: CurrencyCode): void {
      const saved = read();
      update(isCurrency(saved) ? saved : defaultCurrency);
    },
    /** A visitor's choice: applies to every subscriber immediately and is remembered for the next visit. */
    set(c: CurrencyCode): void {
      if (!isCurrency(c)) return;
      update(c);
      write(c);
    },
    /** Another tab changed the saved choice: follow it without writing it back. */
    syncFromStorage(value: string | null): void {
      if (isCurrency(value)) update(value);
    },
  };
}

function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export const currencyStore = createCurrencyStore(browserStorage);
