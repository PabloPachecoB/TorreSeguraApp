import { api, normalizeApiError } from "./apiClient";
import { getRefreshToken, setAccessToken, setTokens } from "./tokenStorage";

export async function login(usernameOrEmail, password) {
  try {
    const response = await api.post("/auth/token/", {
      username: usernameOrEmail,
      password,
    });

    const { access, refresh, user } = response.data || {};
    if (!access || !refresh) {
      throw new Error("Respuesta inválida del servidor (tokens faltantes)");
    }

    await setTokens({ access, refresh });
    return { access, refresh, user };
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}

export async function getMe() {
  try {
    const response = await api.get("/auth/me/");
    return response.data;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }

}


export async function refreshToken(refreshOverride) {
  try {
    const refresh = refreshOverride || (await getRefreshToken());
    if (!refresh) throw new Error("No hay refresh token guardado");

    const response = await api.post("/auth/token/refresh/", { refresh });
    const access = response?.data?.access;
    if (!access) throw new Error("Respuesta inválida del servidor (access faltante)");

    await setAccessToken(access);
    return access;
  } catch (err) {
    const normalized = normalizeApiError(err);
    throw new Error(normalized.message);
  }
}
