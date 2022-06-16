import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-visit-health-rn' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const VisitHealthRn = NativeModules.VisitHealthRn
  ? NativeModules.VisitHealthRn
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function multiply(a: number, b: number): Promise<number> {
  return VisitHealthRn.multiply(a, b);
}
