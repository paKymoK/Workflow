import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.takypok.workflow.auth';

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
};

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), { service: SERVICE });
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (!result) return null;
  try {
    return JSON.parse(result.password) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
