# MVP model configuration policy

Per-user credentials, model picker, embedding configuration, and thinking levels are important, but they are not part of the first working MVP path.

During MVP, use default server-side model configuration from environment variables. The UI may show the active model as read-only.

After the MVP smoke test passes, implement per-user model configuration and editable thinking levels according to this document.

# MODEL_CONFIG.md — Per-User Model, Credential, and Thinking Configuration

This file is the source of truth for user-specific model configuration, model switching in chat, API-key storage, and thinking-level behavior.

## 1. Product requirements

Each authenticated user can maintain their own AI provider credentials and model configurations. One user may use OpenAI, another may use Anthropic, Gemini, Hugging Face, or server-managed defaults. Users must be able to select a different chat model per chat session, similar to choosing a model in ChatGPT, and select a thinking level for models that support reasoning controls.

Required UX:

- Settings page allows users to add, edit, disable, and delete provider credentials.
- Settings page allows users to create named model configurations.
- Chat page includes a model picker in the header or composer.
- Chat page includes a thinking selector: `low`, `medium`, `high`.
- Each chat session stores the selected model configuration and thinking level.
- One user can create and switch between multiple chat sessions.
- Existing chat messages retain the model configuration snapshot used when they were generated.

## 2. Security model for API keys

API keys must not be stored as plaintext.

API keys are not only hashed, because hashed keys cannot be used later to call model APIs. Instead, use this pattern:

1. Encrypt the raw API key server-side using authenticated encryption such as AES-256-GCM or a managed KMS.
2. Store ciphertext, IV/nonce, authentication tag, and key version.
3. Store a non-reversible hash/fingerprint for comparison and audit.
4. Store only safe display metadata such as `last4` and provider name.
5. Never return decrypted keys to the browser.
6. Never send raw keys to logs, LangSmith, traces, browser state, or error payloads.

Recommended fields:

- `api_key_ciphertext`
- `api_key_iv`
- `api_key_tag`
- `api_key_hash`
- `api_key_last4`
- `encryption_key_version`

For MVP, if production-grade encryption cannot be completed in time, users should use server-managed environment keys and the database should store only provider/model preferences. Do not store plaintext user keys as a shortcut.

## 3. Thinking levels

Thinking level controls the reasoning effort or equivalent provider-specific setting.

Canonical internal values:

- `low`
- `medium`
- `high`

Provider mapping examples:

| Provider | Mapping behavior |
|---|---|
| OpenAI reasoning-capable models | Map to provider reasoning effort when supported. |
| Anthropic | Map to budget/max thinking tokens when supported. |
| Gemini | Map to thinking/reasoning config where supported. |
| Hugging Face | Map to generation defaults where applicable; otherwise store as metadata only. |
| Non-reasoning models | Keep setting in session metadata but do not send unsupported params. |

Agents must implement a provider adapter layer so unsupported thinking controls do not break requests.

## 4. Model configuration hierarchy

Use this resolution order when invoking chat:

1. Explicit model config selected in the chat request.
2. Chat session's stored `model_config_id` and `thinking_level`.
3. User's default model config.
4. Server default model from environment variables.
5. Return configuration error if no usable provider/model exists.

Embedding resolution:

1. User's default embedding model config.
2. Server default embedding config.
3. Return configuration error if unavailable.

## 5. Required database objects

Use the detailed schema in `DATABASE_SCHEMA.md`. At minimum, implement:

- `user_provider_credentials`
- `user_model_configs`
- `user_model_preferences`
- `chat_sessions` with model fields
- `chat_messages` with model snapshot metadata

## 6. Required chat behavior

When a user starts a new chat:

1. Create a new `chat_sessions` row.
2. Store selected `model_config_id`.
3. Store selected `thinking_level`.
4. Display the new session in the session sidebar.

When a user switches model inside a chat:

- For MVP, update the current session's model for future messages only.
- Existing messages remain unchanged.
- Store model snapshot on each assistant message.

When a user creates multiple chats:

- Each session has independent messages, selected model, thinking level, title, and timestamps.
- Users can rename, archive, or delete sessions if implemented.
- Users cannot read or mutate another user's sessions.

## 7. API requirements

Required endpoints:

- `GET /api/model-configs`
- `POST /api/model-configs`
- `PATCH /api/model-configs/:id`
- `DELETE /api/model-configs/:id`
- `GET /api/provider-credentials`
- `POST /api/provider-credentials`
- `PATCH /api/provider-credentials/:id`
- `DELETE /api/provider-credentials/:id`
- `POST /api/chat/sessions`
- `PATCH /api/chat/sessions/:id`
- `DELETE /api/chat/sessions/:id`

All endpoints must authenticate the user, derive `user_id` from the server session, validate input with Zod, and enforce RLS.

## 8. Required tests

- User A cannot see User B credentials, configs, or chats.
- API key is encrypted before storage.
- API key hash is stored and raw key is not returned.
- Settings API returns only masked credential metadata.
- Chat can select model config and thinking level.
- Chat session persists selected model and thinking level.
- Message stores model snapshot.
- Multiple chat sessions are isolated and reload correctly.
