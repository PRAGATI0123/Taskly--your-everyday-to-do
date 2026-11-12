/**
 * Safely finds an item in a { id: item } dictionary.
 *
 * Why not just `record[id]`? Every JavaScript object secretly has built-in
 * keys like "constructor" or "toString". A web address such as
 * /projects/constructor/board would then "find" a function instead of a
 * project and crash the page. `Object.hasOwn` only accepts our own items.
 */
export function lookup<T>(record: Record<string, T>, id: string): T | undefined {
  return Object.hasOwn(record, id) ? record[id] : undefined;
}
