const MAX_DIMENSION = 2000;

export type PreparedImage = {
  uri: string;
  fileName: string;
  mimeType: string;
};

function getNativeModules() {
  try {
    // Lazy require so a stale native binary does not crash app boot.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImageManipulator = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
    return { ImagePicker, ImageManipulator };
  } catch {
    throw new Error(
      'Photo upload needs a rebuilt app. Run: npm run ios (rebuilds native modules).',
    );
  }
}

export async function pickAndPrepareImage(): Promise<PreparedImage | null> {
  const { ImagePicker, ImageManipulator } = getNativeModules();

  if (!ImagePicker.getMediaLibraryPermissionsAsync) {
    throw new Error(
      'Photo upload needs a rebuilt app. Run: npm run ios (rebuilds native modules).',
    );
  }

  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Photo library permission is required to upload images.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/native module|ExponentImagePicker|Cannot find/i.test(message)) {
      throw new Error(
        'Photo upload needs a rebuilt app. Run: npm run ios (rebuilds native modules).',
      );
    }
    throw error;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const width = asset.width || MAX_DIMENSION;
  const height = asset.height || MAX_DIMENSION;
  const longest = Math.max(width, height);
  const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    scale < 1
      ? [
          {
            resize: {
              width: Math.round(width * scale),
              height: Math.round(height * scale),
            },
          },
        ]
      : [],
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: manipulated.uri,
    fileName: asset.fileName?.replace(/\.\w+$/, '.jpg') || 'photo.jpg',
    mimeType: 'image/jpeg',
  };
}
