import { NitroModules } from 'react-native-nitro-modules';
import type { TiktokAppEvents } from './TiktokAppEvents.nitro';

const TiktokAppEventsHybridObject =
  NitroModules.createHybridObject<TiktokAppEvents>('TiktokAppEvents');

export function multiply(a: number, b: number): number {
  return TiktokAppEventsHybridObject.multiply(a, b);
}
