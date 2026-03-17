import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

async function secureGetItem(key) {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value != null) return value;
  } catch {
    // ignore and fall back
  }
  return AsyncStorage.getItem(key);
}

async function secureSetItem(key, value) {
  if (value == null) return;
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDeleteItem(key) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(key);
}

export async function getAccessToken() {
  return secureGetItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return secureGetItem(REFRESH_KEY);
}

export async function setAccessToken(access) {
  await secureSetItem(ACCESS_KEY, access);
}

export async function setRefreshToken(refresh) {
  await secureSetItem(REFRESH_KEY, refresh);
}

export async function setTokens({ access, refresh }) {
  if (access) await setAccessToken(access);
  if (refresh) await setRefreshToken(refresh);
}

export async function clearTokens() {
  await Promise.all([secureDeleteItem(ACCESS_KEY), secureDeleteItem(REFRESH_KEY)]);
}
