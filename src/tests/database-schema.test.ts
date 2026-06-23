import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Pool, type PoolClient } from "pg";

const databaseUrl = readEnvValue("DATABASE_URL");
const supabaseUrl = readEnvValue("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = readEnvValue("SUPABASE_SERVICE_ROLE_KEY");

const shouldRunDatabaseTests =
  process.env.RUN_DB_TESTS === "true" &&
  databaseUrl &&
  supabaseUrl &&
  serviceRoleKey;

const describeDatabase = shouldRunDatabaseTests ? describe : describe.skip;

type TestUser = {
  id: string;
  email: string;
};

describeDatabase("Supabase schema and RLS", () => {
  let pool: Pool;
  let userA: TestUser;
  let userB: TestUser;
  let supabaseAdmin: ReturnType<typeof createClient>;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl?.includes("sslmode=disable")
        ? false
        : { rejectUnauthorized: false }
    });

    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    const migrationPaths = readdirSync(migrationsDir)
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort()
      .map((fileName) => path.join(migrationsDir, fileName));

    for (const migrationPath of migrationPaths) {
      const migrationSql = await readFile(migrationPath, "utf8");
      await pool.query(migrationSql);
    }

    supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      },
      global: {
        headers: {
          "x-test-runner": "database-schema-test"
        }
      }
    });

    userA = await createTestUser(supabaseAdmin);
    userB = await createTestUser(supabaseAdmin);
  }, 60_000);

  beforeEach(async () => {
    await cleanupUserData(pool, [userA.id, userB.id]);
  });

  afterAll(async () => {
    if (!pool) {
      return;
    }

    if (userA?.id && userB?.id) {
      await cleanupUserData(pool, [userA.id, userB.id]);
      await supabaseAdmin.auth.admin.deleteUser(userA.id);
      await supabaseAdmin.auth.admin.deleteUser(userB.id);
    }

    await pool.end();
  });

  it("prevents cross-user document reads and allows own document inserts", async () => {
    await pool.query(
      `
        insert into public.documents (
          user_id,
          file_name,
          file_type,
          file_size,
          s3_key,
          status,
          pinecone_namespace
        )
        values
          ($1::uuid, 'alpha.txt', 'text/plain', 12, 'user-a/alpha.txt', 'uploaded', 'user:' || $1::text),
          ($2::uuid, 'bravo.txt', 'text/plain', 34, 'user-b/bravo.txt', 'uploaded', 'user:' || $2::text)
      `,
      [userA.id, userB.id]
    );

    const visibleDocuments = await queryAsAuthenticated(
      pool,
      userA.id,
      `select file_name, user_id from public.documents order by file_name`
    );

    expect(visibleDocuments.rows).toHaveLength(1);
    expect(visibleDocuments.rows[0]).toMatchObject({
      file_name: "alpha.txt",
      user_id: userA.id
    });

    const insertedDocument = await queryAsAuthenticated(
      pool,
      userA.id,
      `
        insert into public.documents (
          user_id,
          file_name,
          file_type,
          file_size,
          s3_key,
          status,
          pinecone_namespace
        )
        values ($1::uuid, 'notes.md', 'text/markdown', 20, 'user-a/notes.md', 'uploaded', 'user:' || $1::text)
        returning user_id, file_name
      `,
      [userA.id],
      true
    );

    expect(insertedDocument.rows[0]).toMatchObject({
      user_id: userA.id,
      file_name: "notes.md"
    });

    await expect(
      queryAsAuthenticated(
        pool,
        userA.id,
        `
          insert into public.documents (
            user_id,
            file_name,
            file_type,
            file_size,
            s3_key,
            status,
            pinecone_namespace
          )
          values ($1::uuid, 'forbidden.txt', 'text/plain', 8, 'user-b/forbidden.txt', 'uploaded', 'user:' || $1::text)
        `,
        [userB.id],
        true
      )
    ).rejects.toThrow(/row-level security/i);
  });

  it("prevents cross-user chat reads and allows own chat message inserts", async () => {
    const sessionInsert = await pool.query(
      `
        insert into public.chat_sessions (user_id, title)
        values
          ($1, 'Alpha session'),
          ($2, 'Bravo session')
        returning id, user_id, title
      `,
      [userA.id, userB.id]
    );

    const sessionA = sessionInsert.rows.find((row) => row.user_id === userA.id);
    const sessionB = sessionInsert.rows.find((row) => row.user_id === userB.id);

    await pool.query(
      `
        insert into public.chat_messages (session_id, user_id, role, content)
        values
          ($1, $2, 'user', 'Alpha says hello'),
          ($3, $4, 'user', 'Bravo says hello')
      `,
      [sessionA.id, userA.id, sessionB.id, userB.id]
    );

    const visibleSessions = await queryAsAuthenticated(
      pool,
      userA.id,
      `select title, user_id from public.chat_sessions order by title`
    );

    expect(visibleSessions.rows).toHaveLength(1);
    expect(visibleSessions.rows[0]).toMatchObject({
      title: "Alpha session",
      user_id: userA.id
    });

    const visibleMessages = await queryAsAuthenticated(
      pool,
      userA.id,
      `select content, user_id from public.chat_messages order by content`
    );

    expect(visibleMessages.rows).toHaveLength(1);
    expect(visibleMessages.rows[0]).toMatchObject({
      content: "Alpha says hello",
      user_id: userA.id
    });

    const insertedMessage = await queryAsAuthenticated(
      pool,
      userA.id,
      `
        insert into public.chat_messages (session_id, user_id, role, content)
        values ($1, $2, 'user', 'Fresh message')
        returning session_id, user_id, content
      `,
      [sessionA.id, userA.id],
      true
    );

    expect(insertedMessage.rows[0]).toMatchObject({
      session_id: sessionA.id,
      user_id: userA.id,
      content: "Fresh message"
    });

    await expect(
      queryAsAuthenticated(
        pool,
        userA.id,
        `
          insert into public.chat_messages (session_id, user_id, role, content)
          values ($1, $2, 'user', 'Cross-user write attempt')
        `,
        [sessionB.id, userA.id],
        true
      )
    ).rejects.toThrow(/chat_messages_session_owner_fk|row-level security/i);
  }, 15_000);

  it("prevents cross-user MCP config reads and rejects invalid transports", async () => {
    await pool.query(
      `
        insert into public.mcp_server_configs (
          user_id,
          name,
          transport,
          command,
          args,
          env_encrypted,
          enabled
        )
        values
          ($1::uuid, 'User A tools', 'stdio', 'npx', '["allowed-server"]'::jsonb, '{"TOKEN":"cipher"}'::jsonb, true),
          ($2::uuid, 'User B tools', 'stdio', 'npx', '["other-server"]'::jsonb, '{"TOKEN":"cipher"}'::jsonb, false)
      `,
      [userA.id, userB.id]
    );

    const visibleConfigs = await queryAsAuthenticated(
      pool,
      userA.id,
      `select name, user_id from public.mcp_server_configs order by name`
    );

    expect(visibleConfigs.rows).toHaveLength(1);
    expect(visibleConfigs.rows[0]).toMatchObject({
      name: "User A tools",
      user_id: userA.id
    });

    await expect(
      queryAsAuthenticated(
        pool,
        userA.id,
        `
          insert into public.mcp_server_configs (
            user_id,
            name,
            transport,
            command
          )
          values ($1::uuid, 'Broken transport', 'socket', 'npx')
        `,
        [userA.id],
        true
      )
    ).rejects.toThrow(/mcp_server_configs_transport_check|invalid input value/i);
  });
});

async function createTestUser(
  supabaseAdmin: any
): Promise<TestUser> {
  const email = `codex-${randomUUID()}@example.com`;
  const response = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: "CodexTest123!"
  });

  if (response.error || !response.data.user) {
    throw response.error ?? new Error("Unable to create test user.");
  }

  return {
    id: response.data.user.id,
    email
  };
}

function readEnvValue(name: string) {
  if (process.env[name]) {
    return process.env[name];
  }

  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const line = readFileSync(filePath, "utf8")
      .split("\n")
      .find((entry) => entry.startsWith(`${name}=`));

    if (line) {
      return line.slice(name.length + 1).trim();
    }
  }

  return undefined;
}

async function cleanupUserData(pool: Pool, userIds: string[]) {
  await pool.query(`delete from public.agent_tool_calls where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.mcp_tool_invocations where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.mcp_server_configs where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.chat_messages where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.chat_sessions where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.document_chunks where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.documents where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.user_model_preferences where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.user_model_configs where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.user_provider_credentials where user_id = any($1::uuid[])`, [userIds]);
  await pool.query(`delete from public.profiles where id = any($1::uuid[])`, [userIds]);
}

async function queryAsAuthenticated(
  pool: Pool,
  userId: string,
  sql: string,
  params: unknown[] = [],
  commit = false
) {
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query("set local role authenticated");
    await client.query(`select set_config('request.jwt.claim.role', 'authenticated', true)`);
    await client.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);

    const result = await client.query(sql, params);

    if (commit) {
      await client.query("commit");
    } else {
      await client.query("rollback");
    }

    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
