export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey
  };
}

export function getS3Env() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.S3_BUCKET_NAME;

  if (!region) {
    throw new Error("Missing required environment variable: AWS_REGION");
  }

  if (!accessKeyId) {
    throw new Error("Missing required environment variable: AWS_ACCESS_KEY_ID");
  }

  if (!secretAccessKey) {
    throw new Error("Missing required environment variable: AWS_SECRET_ACCESS_KEY");
  }

  if (!bucketName) {
    throw new Error("Missing required environment variable: S3_BUCKET_NAME");
  }

  return {
    region,
    accessKeyId,
    secretAccessKey,
    bucketName
  };
}

export function getPineconeEnv() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;
  const dimension = getPineconeDimensionEnv();

  if (!apiKey) {
    throw new Error("Missing required environment variable: PINECONE_API_KEY");
  }

  if (!indexName) {
    throw new Error("Missing required environment variable: PINECONE_INDEX_NAME");
  }

  return {
    apiKey,
    dimension,
    indexName
  };
}

export function getPineconeDimensionEnv() {
  const dimensionValue = process.env.PINECONE_VECTOR_DIMENSION;

  if (!dimensionValue) {
    throw new Error("Missing required environment variable: PINECONE_VECTOR_DIMENSION");
  }

  const dimension = Number.parseInt(dimensionValue, 10);

  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new Error("PINECONE_VECTOR_DIMENSION must be a positive integer.");
  }

  return dimension;
}

export function getTavilyEnv() {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required environment variable: TAVILY_API_KEY");
  }

  return {
    apiKey
  };
}

export function getRuntimeMcpEnv() {
  const httpTimeoutValue = process.env.MCP_HTTP_TIMEOUT_MS || "30000";
  const httpTimeoutMs = Number.parseInt(httpTimeoutValue, 10);

  if (!Number.isInteger(httpTimeoutMs) || httpTimeoutMs <= 0) {
    throw new Error("MCP_HTTP_TIMEOUT_MS must be a positive integer.");
  }

  return {
    httpTimeoutMs,
    runtimeEnabled: process.env.MCP_RUNTIME_ENABLED === "true",
    stdioAllowlist: (process.env.MCP_STDIO_ALLOWLIST || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  };
}
