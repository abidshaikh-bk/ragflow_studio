import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getProviderCredentialSecret,
  getUserSettings
} from "@/server/settings/service";

const credentialsInMock = vi.fn();
const credentialsMaybeSingleMock = vi.fn();
const credentialsEqLabelMock = vi.fn(() => ({
  eq: credentialsEqIsActiveMock
}));
const credentialsEqProviderMock = vi.fn(() => ({
  eq: credentialsEqLabelMock
}));
const credentialsEqIsActiveMock = vi.fn();
const credentialsEqUserMock = vi.fn(() => ({
  eq: credentialsEqIsActiveMock
}));
const credentialsSelectMock = vi.fn(() => ({
  eq: credentialsEqUserMock
}));

const configsEqIsActiveMock = vi.fn();
const configsEqIsDefaultMock = vi.fn(() => ({
  eq: configsEqIsActiveMock
}));
const configsEqUserMock = vi.fn(() => ({
  eq: configsEqIsDefaultMock
}));
const configsSelectMock = vi.fn(() => ({
  eq: configsEqUserMock
}));

const fromMock = vi.fn((table: string) => {
  if (table === "user_model_configs") {
    return {
      select: configsSelectMock
    };
  }

  if (table === "user_provider_credentials") {
    return {
      select: credentialsSelectMock
    };
  }

  throw new Error(`Unexpected table: ${table}`);
});

const supabaseMock = {
  from: fromMock
};

describe("settings service", () => {
  beforeEach(() => {
    fromMock.mockClear();
    configsSelectMock.mockClear();
    configsEqUserMock.mockClear();
    configsEqIsDefaultMock.mockClear();
    configsEqIsActiveMock.mockReset();
    credentialsSelectMock.mockClear();
    credentialsEqUserMock.mockClear();
    credentialsEqProviderMock.mockClear();
    credentialsEqLabelMock.mockClear();
    credentialsEqIsActiveMock.mockReset();
    credentialsInMock.mockReset();
    credentialsMaybeSingleMock.mockReset();

    configsEqIsActiveMock.mockResolvedValue({
      data: [
        {
          id: "cfg-1",
          kind: "chat",
          model_name: "gpt-4.1-mini",
          provider: "openai"
        },
        {
          id: "cfg-2",
          kind: "embedding",
          model_name: "text-embedding-3-small",
          provider: "openai"
        }
      ],
      error: null
    });

    credentialsEqIsActiveMock.mockReturnValue({
      in: credentialsInMock
    });
  });

  it("does not present legacy masked secrets when the encrypted payload is missing", async () => {
    credentialsInMock.mockResolvedValue({
      data: [
        {
          api_key_ciphertext: null,
          api_key_iv: null,
          api_key_last4: "1234",
          api_key_tag: null,
          id: "cred-1",
          is_active: true,
          label: "default-chat",
          provider: "openai"
        },
        {
          api_key_ciphertext: null,
          api_key_iv: null,
          api_key_last4: "5678",
          api_key_tag: null,
          id: "cred-2",
          is_active: true,
          label: "default-embedding",
          provider: "openai"
        }
      ],
      error: null
    });

    const result = await getUserSettings(supabaseMock as never, "user-123");

    expect(result.chatApiKeyMasked).toBeNull();
    expect(result.embeddingApiKeyMasked).toBeNull();
  });

  it("throws a re-entry error when a legacy credential row has no encrypted secret", async () => {
    credentialsEqUserMock.mockReturnValue({
      eq: credentialsEqProviderMock
    });
    credentialsEqIsActiveMock.mockReturnValue({
      maybeSingle: credentialsMaybeSingleMock
    });
    credentialsMaybeSingleMock.mockResolvedValue({
      data: {
        api_key_ciphertext: null,
        api_key_iv: null,
        api_key_last4: "5678",
        api_key_tag: null,
        encryption_key_version: null,
        id: "cred-2",
        is_active: true,
        label: "default-embedding",
        provider: "gemini"
      },
      error: null
    });

    await expect(
      getProviderCredentialSecret(supabaseMock as never, {
        label: "default-embedding",
        provider: "gemini",
        userId: "user-123"
      })
    ).rejects.toThrow(/must be re-entered in Settings/i);
  });
});
