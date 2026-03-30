import type { AnyMap } from 'react-native-nitro-modules'
import { NitroModules } from 'react-native-nitro-modules'
import type {
  TikTokAppEvents as NativeTikTokAppEvents,
  TikTokEvent,
  TikTokIdentity,
  TikTokInitializeOptions,
} from './specs/TikTokAppEvents.nitro'

export const TikTokStandardEventNames = {
  AchieveLevel: 'AchieveLevel',
  AddPaymentInfo: 'AddPaymentInfo',
  AddToCart: 'AddToCart',
  AddToWishlist: 'AddToWishlist',
  Checkout: 'Checkout',
  CompleteTutorial: 'CompleteTutorial',
  CreateGroup: 'CreateGroup',
  CreateRole: 'CreateRole',
  GenerateLead: 'GenerateLead',
  ImpressionLevelAdRevenue: 'ImpressionLevelAdRevenue',
  InAppADClick: 'InAppADClick',
  InAppADImpr: 'InAppADImpr',
  InstallApp: 'InstallApp',
  JoinGroup: 'JoinGroup',
  LaunchAPP: 'LaunchAPP',
  Login: 'Login',
  Purchase: 'Purchase',
  Rate: 'Rate',
  Registration: 'Registration',
  Search: 'Search',
  SpendCredits: 'SpendCredits',
  StartTrial: 'StartTrial',
  Subscribe: 'Subscribe',
  UnlockAchievement: 'UnlockAchievement',
  ViewContent: 'ViewContent',
} as const

export type TikTokStandardEventName =
  (typeof TikTokStandardEventNames)[keyof typeof TikTokStandardEventNames]

export interface InitializeTikTokAppEventsOptions
  extends Omit<TikTokInitializeOptions, 'tikTokAppIds'> {
  tikTokAppId: string | string[]
}

let nativeModule: NativeTikTokAppEvents | undefined

function getNativeModule(): NativeTikTokAppEvents {
  if (nativeModule == null) {
    nativeModule =
      NitroModules.createHybridObject<NativeTikTokAppEvents>('TikTokAppEvents')
  }

  return nativeModule
}

function normalizeString(value?: string): string | undefined {
  if (value == null) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeEmail(value?: string): string | undefined {
  const normalized = normalizeString(value)
  return normalized?.toLowerCase()
}

function normalizeTikTokAppIds(value: string | string[]): string[] {
  const ids = Array.isArray(value)
    ? value
    : value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)

  const normalized = ids.map((entry) => entry.trim()).filter(Boolean)
  if (normalized.length === 0) {
    throw new Error('At least one TikTok App ID is required.')
  }

  return normalized
}

function normalizeEvent(event: TikTokEvent): TikTokEvent {
  const name = normalizeString(event.name)
  if (name == null) {
    throw new Error('TikTok event name cannot be empty.')
  }

  return {
    name,
    eventId: normalizeString(event.eventId),
    properties: event.properties,
  }
}

export const TikTokAppEventsModule = {
  initialize(options: InitializeTikTokAppEventsOptions) {
    const { tikTokAppId, ...rest } = options

    return getNativeModule().initialize({
      ...rest,
      tikTokAppIds: normalizeTikTokAppIds(tikTokAppId),
    })
  },

  startTracking() {
    getNativeModule().startTracking()
  },

  identify(identity: TikTokIdentity) {
    getNativeModule().identify({
      externalId: normalizeString(identity.externalId),
      externalUserName: normalizeString(identity.externalUserName),
      phoneNumber: normalizeString(identity.phoneNumber),
      email: normalizeEmail(identity.email),
    })
  },

  logout() {
    getNativeModule().logout()
  },

  trackEvent(event: TikTokEvent) {
    getNativeModule().trackEvent(normalizeEvent(event))
  },

  trackStandardEvent(
    name: TikTokStandardEventName,
    properties?: AnyMap,
    eventId?: string
  ) {
    getNativeModule().trackEvent({
      name,
      eventId: normalizeString(eventId),
      properties,
    })
  },

  trackCustomEvent(name: string, properties?: AnyMap, eventId?: string) {
    getNativeModule().trackEvent({
      name,
      eventId: normalizeString(eventId),
      properties,
    })
  },

  trackAdRevenueEvent(adRevenue: AnyMap, eventId?: string) {
    getNativeModule().trackEvent({
      name: TikTokStandardEventNames.ImpressionLevelAdRevenue,
      eventId: normalizeString(eventId),
      properties: adRevenue,
    })
  },

  fetchDeferredDeepLink() {
    return getNativeModule().fetchDeferredDeepLink()
  },
}

export default TikTokAppEventsModule

export type {
  TikTokEvent,
  TikTokIdentity,
  TikTokInitializeOptions,
} from './specs/TikTokAppEvents.nitro'
