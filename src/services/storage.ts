import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStorageString(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function setStorageString(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}
