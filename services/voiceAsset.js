import { Platform } from "react-native";

function writeAscii(view, offset, value) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function audioBufferToWav(audioBuffer) {
  const frames = audioBuffer.length;
  const channelCount = audioBuffer.numberOfChannels;
  const samples = new Float32Array(frames);
  for (let channel = 0; channel < channelCount; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frames; i += 1) samples[i] += data[i] / channelCount;
  }

  const wav = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(wav);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + frames * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, frames * 2, true);
  for (let i = 0; i < frames; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return wav;
}

/** Normaliza la salida de Expo AV a un formato admitido por Qwen3.5-Omni. */
export async function prepararAudioParaQwen(uri) {
  if (Platform.OS !== "web") {
    return {
      uri,
      fileName: `mensaje-voz-${Date.now()}.aac`,
      mimeType: "audio/aac",
    };
  }

  const response = await fetch(uri);
  const source = await response.arrayBuffer();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Este navegador no puede convertir la grabación.");
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(source.slice(0));
    const wav = audioBufferToWav(decoded);
    const fileName = `mensaje-voz-${Date.now()}.wav`;
    const file = new File([wav], fileName, { type: "audio/wav" });
    return { uri, file, fileName, mimeType: "audio/wav" };
  } finally {
    await context.close();
  }
}
