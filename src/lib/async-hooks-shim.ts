export class AsyncLocalStorage<T = any> {
  private store: T | undefined = undefined;

  getStore(): T | undefined {
    return this.store;
  }

  run<R>(store: T, callback: () => R): R {
    const prev = this.store;
    this.store = store;
    try {
      return callback();
    } finally {
      this.store = prev;
    }
  }

  enterWith(store: T): void {
    this.store = store;
  }

  disable(): void {
    this.store = undefined;
  }
}

export function getStartContext(opts?: { throwIfNotFound?: boolean }): any {
  return undefined;
}

export async function runWithStartContext<R>(context: any, fn: () => R): Promise<R> {
  return fn();
}

const shim = {
  AsyncLocalStorage,
  getStartContext,
  runWithStartContext,
};

export default shim;
