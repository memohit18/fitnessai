import * as Device from 'expo-device';
import { Platform } from 'react-native';

export function getDeviceName(): string {
  if (Device.modelName) {
    return Device.modelName;
  }

  if (Device.deviceName) {
    return Device.deviceName;
  }

  return Platform.OS === 'ios' ? 'iOS Device' : 'Android Device';
}

export function getDeviceType(): 'mobile' {
  return 'mobile';
}
