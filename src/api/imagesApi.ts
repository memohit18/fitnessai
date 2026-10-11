import { env } from '../constants';
import {
  getPreferredImageUrl,
  makeIdempotencyKey,
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
};

async function postImage(
  accessToken: string,
  input: UploadImageInput,
): Promise<Response> {
  const form = new FormData();
  form.append('type', input.type);
  form.append('file', {
    uri: input.uri,
    name: input.fileName ?? 'photo.jpg',
    type: input.mimeType ?? 'image/jpeg',
  } as unknown as Blob);

  return fetch(`${env.apiUrl}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Idempotency-Key': makeIdempotencyKey(),
    },
    body: form,
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
