const REDACTED_VALUE = "[REDACTED]";
const INLINE_SECRET_PATTERNS = [
  /(Bearer\s+)([A-Za-z0-9._-]+)/gi,
  /\bsk-[A-Za-z0-9_-]+\b/g,
  /(authorization\s*(?:is|was|=|:)\s*)(["']?)([^"',\s]+)\2/gi,
  /(api[_ -]?key\s*(?:is|was|=|:)\s*)(["']?)([^"',\s]+)\2/gi,
  /(api[_ -]?key\s+)(["']?)([^"',\s]*[-_][^"',\s]*)\2/gi,
  /(secret\s*(?:is|was|=|:)\s*)(["']?)([^"',\s]+)\2/gi,
  /(secret\s+)(["']?)([^"',\s]*[-_][^"',\s]*)\2/gi,
  /(token\s*(?:is|was|=|:)\s*)(["']?)([^"',\s]+)\2/gi,
  /(token\s+)(["']?)([^"',\s]*[-_][^"',\s]*)\2/gi,
  /(password\s*(?:is|was|=|:)\s*)(["']?)([^"',\s]+)\2/gi
] as const;

export function redactSecretsInText(value: string) {
  return INLINE_SECRET_PATTERNS.reduce((sanitized, pattern) => {
    if (pattern.source === "\\bsk-[A-Za-z0-9_-]+\\b") {
      return sanitized.replace(pattern, REDACTED_VALUE);
    }

    return sanitized.replace(pattern, (_, prefix: string) => {
      return `${prefix}${REDACTED_VALUE}`;
    });
  }, value);
}

export function redactSecretsInValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactSecretsInText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecretsInValue(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      if (isSensitiveKey(key)) {
        return [key, REDACTED_VALUE];
      }

      return [key, redactSecretsInValue(nestedValue)];
    })
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();

  return (
    normalized.includes("api_key") ||
    normalized.includes("apikey") ||
    normalized === "authorization" ||
    normalized.endsWith("authorization") ||
    normalized.includes("secret") ||
    normalized.endsWith("token") ||
    normalized.endsWith("password")
  );
}
