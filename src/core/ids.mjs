export function makeId(prefix, index) {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

export function clone(value) {
  return structuredClone(value);
}
