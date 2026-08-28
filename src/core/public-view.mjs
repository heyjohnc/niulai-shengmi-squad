const PRIVATE_KEYS = new Set([
  "private_note",
  "provider_payload",
  "transport_receipt",
  "internal_seed",
  "raw_output"
]);

export function toPublicView(value) {
  if (Array.isArray(value)) return value.map(toPublicView);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.startsWith("_") && !PRIVATE_KEYS.has(key))
      .map(([key, child]) => [key, toPublicView(child)])
  );
}
