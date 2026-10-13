import { File as ExpoFile, UploadType } from 'expo-file-system';

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

type UploadHttpResult = {
  status: number;
  body: string;
};

function normalizeFileUri(uri: string) {
  if (uri.startsWith('file://')) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
}

/**
 * Desktop sends FormData(type + File). On Expo SDK 56, RN FormData `{uri}` and
 * `new Blob([ArrayBuffer])` both fail — use native multipart File.upload instead
 * (same fields: `type` + `file`).
 */
async function postImage(
  accessToken: string,
  input: UploadImageInput,
): Promise<UploadHttpResult> {
  const type = normalizeImageType(input.type);
  if (!isValidImageType(type)) {
    throw new Error(
      'Type must be lowercase letters, numbers, _ or - (e.g. profile).',
    );
  }

  const uri = normalizeFileUri(input.uri);
  const file = new ExpoFile(uri);
  if (!file.exists) {
    throw new Error('Prepared image file was not found on disk.');
  }

  const idempotencyKey =
    input.idempotencyKey?.trim() || makeIdempotencyKey();

  const result = await file.upload(`${env.apiUrl}/images`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: input.mimeType ?? 'image/jpeg',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Idempotency-Key': idempotencyKey,
    },
    parameters: { type },
  });

  return { status: result.status, body: result.body };
}

function parseJsonBody(body: string): unknown {
  if (!body?.trim()) return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
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

    const json = parseJsonBody(response.body);
    if (response.status < 200 || response.status >= 300) {
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
