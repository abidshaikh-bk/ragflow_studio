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

  if (!apiKey) {
    throw new Error("Missing required environment variable: PINECONE_API_KEY");
  }

  if (!indexName) {
    throw new Error("Missing required environment variable: PINECONE_INDEX_NAME");
  }

  return {
    apiKey,
    indexName
  };
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
