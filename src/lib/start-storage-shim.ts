export function getStartContext(opts?: { throwIfNotFound?: boolean }): any {
  return undefined;
}

export async function runWithStartContext<R>(context: any, fn: () => R): Promise<R> {
  return fn();
}

export default { getStartContext, runWithStartContext };
