import { Platform } from "react-native";

/** Agrega un asset de Expo a FormData tanto en navegador como en iOS/Android. */
export async function appendAsset(formData, field, asset, fallbackName, fallbackType) {
  const name = asset.fileName || asset.name || fallbackName;
  const type = asset.mimeType || asset.type || fallbackType;

  if (Platform.OS === "web") {
    let file = asset.file;
    if (!file) {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      file = typeof File !== "undefined"
        ? new File([blob], name, { type: type || blob.type })
        : blob;
    }
    formData.append(field, file, name);
    return;
  }

  formData.append(field, { uri: asset.uri, name, type });
}

/** Deja que Axios genere multipart/form-data con el boundary correcto. */
export function removeContentType(headers) {
  if (!headers) return;
  if (typeof headers.delete === "function") {
    headers.delete("Content-Type");
    return;
  }
  delete headers["Content-Type"];
  delete headers["content-type"];
}
