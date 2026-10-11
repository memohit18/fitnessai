import { baseApi } from './baseApi';
import { getApiErrorMessage } from '../utils/api';

export async function updateFoodImage(
  foodId: string,
  imageUrl: string,
): Promise<void> {
  try {
    await baseApi.patch(`/foods/${foodId}`, { imageUrl });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to save food image.'));
  }
}
