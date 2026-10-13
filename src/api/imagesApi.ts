import { fetch as expoFetch } from 'expo/fetch';
import { File as ExpoFile } from 'expo-file-system';

import { env } from '../constants';
import {
  getPreferredImageUrl,
  isValidImageType,
  makeIdempotencyKey,
  normalizeImageType,
  unwrapUploadedUserImage,
  type UserImage,
} from '../lib/images/imageResponse';
import {
  getValidAccessToken,
  refreshAccessToken,
  shouldAttemptTokenRefresh,
} from '../services/tokenRefresh';
import { getApiErrorMessage } from '../utils/api';

type UploadImageInput = {
  uri: string;
  type: string;
  fileName?: string;
  mimeType?: string;
  idempotencyKey?: string;
};

function normalizeFileUri(uri: string) {
  if (uri.startsWith('file://')) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
}

/**
 * Mirror desktop `imagesService.upload`: FormData with `type` + real file blob.
 * Expo SDK 56 fetch rejects RN `{ uri, name, type }` parts — read bytes via
 * expo-file-system and append a Blob (same shape as desktop `File`).
 */
async function buildUploadForm(input: UploadImageInput): Promise<FormData> {
  const type = normalizeImageType(input.type);
  if (!isValidImageType(type)) {
    throw new Error(
      'Type must be lowercase letters, numbers, _ or - (e.g. profile).',
    );
  }

  const uri = normalizeFileUri(input.uri);
  const source = new ExpoFile(uri);
  if (!source.exists) {
    throw new Error('Prepared image file was not found on disk.');
  }

  const mimeType = input.mimeType ?? 'image/jpeg';
  const fileName = input.fileName?.trim() || source.name || 'photo.jpg';
  const buffer = await source.arrayBuffer();
  const blob = new Blob([buffer], { type: mimeType });

  const form = new FormData();
  form.append('type', type);
  // Third arg sets Content-Disposition filename (desktop File.name).
  form.append('file', blob, fileName);
  return form;
}

async function postImage(
  accessToken: string,
  input: UploadImageInput,
): Promise<Response> {
  const idempotencyKey =
    input.idempotencyKey?.trim() || makeIdempotencyKey();

  return expoFetch(`${env.apiUrl}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: await buildUploadForm(input),
  });
}

export async function uploadImage(input: UploadImageInput): Promise<{
  image: UserImage;
  url: string;
}> {
  try {
    let accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('Sign in to upload images.');
    }

    let response = await postImage(accessToken, input);

    if (shouldAttemptTokenRefresh(response.status, '/images')) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        accessToken = refreshed;
        response = await postImage(accessToken, input);
      }
    }

    const json = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const message =
        json &&
        typeof json === 'object' &&
        typeof (json as { message?: unknown }).message === 'string'
          ? (json as { message: string }).message
          : `Upload failed (${response.status}).`;
      throw new Error(message);
    }

    const image = unwrapUploadedUserImage(json);
    if (!image) {
      throw new Error('Upload succeeded but image payload was empty.');
    }

    const url = getPreferredImageUrl(image);
    if (!url) {
      throw new Error('Upload succeeded but no usable image URL was returned.');
    }

    return { image, url };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to upload image.'));
  }
}
