import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

import {
  absoluteApiUrl,
  authorizedHeaders,
  isTrustedApiUrl,
} from '@/services/api';

export async function authenticatedImageSource(pathOrUrl?: string | null) {
  if (!pathOrUrl || !isTrustedApiUrl(pathOrUrl)) return undefined;
  return {
    uri: absoluteApiUrl(pathOrUrl),
    headers: await authorizedHeaders(),
  };
}

export async function downloadAuthenticatedFile(pathOrUrl: string, suggestedName: string) {
  if (!isTrustedApiUrl(pathOrUrl)) {
    throw new Error('El archivo solicitado no pertenece al servidor autorizado.');
  }

  const url = absoluteApiUrl(pathOrUrl);
  const headers = await authorizedHeaders();
  const safeName = sanitizeFileName(suggestedName);

  if (Platform.OS === 'web') {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('No se pudo descargar el archivo.');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = safeName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return objectUrl;
  }

  const destination = `${FileSystem.cacheDirectory}${Date.now()}-${safeName}`;
  const result = await FileSystem.downloadAsync(url, destination, { headers });
  if (result.status < 200 || result.status >= 300) {
    throw new Error('No se pudo descargar el archivo.');
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      dialogTitle: `Abrir ${safeName}`,
      mimeType: mimeTypeForName(safeName),
    });
  } else {
    await Linking.openURL(result.uri);
  }
  return result.uri;
}

function sanitizeFileName(value: string) {
  const clean = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return clean || 'archivo-cepreuna';
}

function mimeTypeForName(name: string) {
  const extension = name.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  return types[extension ?? ''] ?? 'application/octet-stream';
}
