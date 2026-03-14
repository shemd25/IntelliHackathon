import * as SecureStore from 'expo-secure-store';
import { API_URL, STORE_KEY_TOKEN, STORE_KEY_CHILD_ID, STORE_KEY_CHILD_NAME } from '../constants/config';
import { AuthResponse } from '../types';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Login failed (${response.status}): ${text}`);
    }

    const data: AuthResponse = await response.json();

    if (!data.token) {
      throw new Error('No token in auth response');
    }
    if (!data.children || data.children.length === 0) {
      throw new Error('No children associated with this account');
    }

    // Persist credentials for background task access
    await SecureStore.setItemAsync(STORE_KEY_TOKEN, data.token);
    await SecureStore.setItemAsync(STORE_KEY_CHILD_ID, data.children[0].id);
    await SecureStore.setItemAsync(STORE_KEY_CHILD_NAME, data.children[0].name);

    return data;
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORE_KEY_TOKEN);
    } catch {
      return null;
    }
  }

  async getStoredChildId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORE_KEY_CHILD_ID);
    } catch {
      return null;
    }
  }

  async getStoredChildName(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORE_KEY_CHILD_NAME);
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(STORE_KEY_TOKEN);
    await SecureStore.deleteItemAsync(STORE_KEY_CHILD_ID);
    await SecureStore.deleteItemAsync(STORE_KEY_CHILD_NAME);
  }
}

export default new AuthService();
