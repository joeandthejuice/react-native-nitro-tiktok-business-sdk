import type { AnyMap } from 'react-native-nitro-modules';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  TikTokAppEvents as NativeTikTokAppEvents,
  TikTokContent,
  TikTokContentEvent as NativeTikTokContentEvent,
  TikTokContentEventProperties,
  TikTokIdentity,
  TikTokInitializeOptions,
} from './specs/TikTokAppEvents.nitro';

export type TikTokPropertyValue =
  | string
  | number
  | boolean
  | null
  | TikTokPropertyMap
  | TikTokPropertyValue[];

export interface TikTokPropertyMap {
  [key: string]: TikTokPropertyValue | undefined;
}

export interface TikTokEvent {
  name: string;
  eventId?: string;
  properties?: TikTokPropertyMap;
}

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
} as const;

export const TikTokContentEventNames = {
  AddToCart: TikTokStandardEventNames.AddToCart,
  AddToWishlist: TikTokStandardEventNames.AddToWishlist,
  Checkout: TikTokStandardEventNames.Checkout,
  Purchase: TikTokStandardEventNames.Purchase,
  ViewContent: TikTokStandardEventNames.ViewContent,
} as const;

export type TikTokStandardEventName =
  (typeof TikTokStandardEventNames)[keyof typeof TikTokStandardEventNames];

export type TikTokContentEventName =
  (typeof TikTokContentEventNames)[keyof typeof TikTokContentEventNames];

export interface InitializeTikTokAppEventsOptions
  extends Omit<TikTokInitializeOptions, 'tikTokAppIds'> {
  tikTokAppId?: string | string[];
}

let nativeModule: NativeTikTokAppEvents | undefined;

function getNativeModule(): NativeTikTokAppEvents {
  if (nativeModule == null) {
    nativeModule =
      NitroModules.createHybridObject<NativeTikTokAppEvents>('TikTokAppEvents');
  }

  return nativeModule;
}

function normalizeString(value?: string): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireString(value: string | undefined, message: string): string {
  const normalized = normalizeString(value);
  if (normalized == null) {
    throw new Error(message);
  }

  return normalized;
}

function normalizeEmail(value?: string): string | undefined {
  const normalized = normalizeString(value);
  return normalized?.toLowerCase();
}

function normalizeTikTokAppIdEntry(value: string, label: string): string {
  const normalized = requireString(
    value,
    `${label} must be a non-empty numeric string.`
  );

  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} must contain only digits.`);
  }

  return normalized;
}

function normalizeTikTokAppIds(
  value?: string | string[]
): string[] | undefined {
  if (value == null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error('At least one TikTok App ID is required.');
    }

    return value.map((entry, index) =>
      normalizeTikTokAppIdEntry(entry, `TikTok App ID at index ${index}`)
    );
  }

  if (value.includes('\uff0c')) {
    throw new Error(
      'TikTok App IDs must use standard commas, not full-width commas.'
    );
  }

  const entries = value.split(',');
  if (entries.some((entry) => entry.trim().length === 0)) {
    throw new Error(
      'TikTok App IDs cannot contain empty entries, leading commas, trailing commas, or consecutive commas.'
    );
  }

  return entries.map((entry) =>
    normalizeTikTokAppIdEntry(entry, 'TikTok App ID')
  );
}

function normalizeFiniteNumber(value: number | undefined, label: string) {
  if (value == null) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return value;
}

function normalizeInteger(value: number | undefined, label: string) {
  if (value == null) {
    return undefined;
  }

  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }

  return value;
}

function normalizeCurrency(value?: string): string | undefined {
  const normalized = normalizeString(value);
  if (normalized == null) {
    return undefined;
  }

  const uppercased = normalized.toUpperCase();
  if (!/^[A-Z]{3}$/.test(uppercased)) {
    throw new Error(
      'TikTok content event currency must be a 3-letter ISO 4217 code.'
    );
  }

  return uppercased;
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizePropertyValue(
  value: unknown,
  path: string
): TikTokPropertyValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} must be a finite number.`);
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => sanitizePropertyValue(entry, `${path}[${index}]`))
      .filter((entry): entry is TikTokPropertyValue => entry !== undefined);
  }

  if (typeof value === 'object') {
    if (!isPlainObject(value)) {
      throw new Error(
        `${path} must be a plain object, array, string, number, boolean, or null.`
      );
    }

    const result: TikTokPropertyMap = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      const sanitized = sanitizePropertyValue(nestedValue, `${path}.${key}`);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    });
    return result;
  }

  throw new Error(
    `${path} must not contain functions, symbols, bigint values, or unsupported object types.`
  );
}

function normalizeProperties(
  properties?: TikTokPropertyMap
): AnyMap | undefined {
  if (properties == null) {
    return undefined;
  }

  const sanitized = sanitizePropertyValue(properties, 'properties');
  if (sanitized == null || Array.isArray(sanitized)) {
    throw new Error('TikTok event properties must be a plain object.');
  }

  return sanitized as unknown as AnyMap;
}

function normalizeContent(content: TikTokContent): TikTokContent | undefined {
  const normalized: TikTokContent = {
    contentId: normalizeString(content.contentId),
    contentCategory: normalizeString(content.contentCategory),
    contentName: normalizeString(content.contentName),
    brand: normalizeString(content.brand),
    price: normalizeFiniteNumber(content.price, 'TikTok content price'),
    quantity: normalizeInteger(content.quantity, 'TikTok content quantity'),
  };

  return hasDefinedValues(normalized) ? normalized : undefined;
}

function normalizeContentEventProperties(
  properties?: TikTokContentEventProperties
): TikTokContentEventProperties | undefined {
  if (properties == null) {
    return undefined;
  }

  const contents = properties.contents
    ?.map((content) => normalizeContent(content))
    .filter((content): content is TikTokContent => content != null);

  const normalized: TikTokContentEventProperties = {
    contentType: normalizeString(properties.contentType),
    contentId: normalizeString(properties.contentId),
    description: normalizeString(properties.description),
    currency: normalizeCurrency(properties.currency),
    value: normalizeFiniteNumber(
      properties.value,
      'TikTok content event value'
    ),
    orderId: normalizeString(properties.orderId),
    contents: contents != null && contents.length > 0 ? contents : undefined,
  };

  return hasDefinedValues(normalized) ? normalized : undefined;
}

function hasDefinedValues(value: object): boolean {
  return Object.values(value).some((entry) => entry !== undefined);
}

function normalizeEvent(event: TikTokEvent): {
  name: string;
  eventId?: string;
  properties?: AnyMap;
} {
  return {
    name: requireString(event.name, 'TikTok event name cannot be empty.'),
    eventId: normalizeString(event.eventId),
    properties: normalizeProperties(event.properties),
  };
}

function normalizeContentEvent(
  name: TikTokContentEventName,
  properties?: TikTokContentEventProperties,
  eventId?: string
): NativeTikTokContentEvent {
  return {
    name,
    eventId: normalizeString(eventId),
    properties: normalizeContentEventProperties(properties),
  };
}

export const TikTokAppEventsModule = {
  initialize(options: InitializeTikTokAppEventsOptions) {
    const { tikTokAppId, ...rest } = options;

    return getNativeModule().initialize({
      ...rest,
      accessToken: requireString(
        rest.accessToken,
        'TikTok initialization requires a non-empty accessToken.'
      ),
      appId: normalizeString(rest.appId),
      tikTokAppIds: normalizeTikTokAppIds(tikTokAppId),
    });
  },

  startTracking() {
    getNativeModule().startTracking();
  },

  identify(identity: TikTokIdentity) {
    getNativeModule().identify({
      externalId: normalizeString(identity.externalId),
      externalUserName: normalizeString(identity.externalUserName),
      phoneNumber: normalizeString(identity.phoneNumber),
      email: normalizeEmail(identity.email),
    });
  },

  logout() {
    getNativeModule().logout();
  },

  flush() {
    getNativeModule().flush();
  },

  trackEvent(event: TikTokEvent) {
    getNativeModule().trackEvent(normalizeEvent(event));
  },

  trackStandardEvent(
    name: TikTokStandardEventName,
    properties?: TikTokPropertyMap,
    eventId?: string
  ) {
    getNativeModule().trackEvent({
      name,
      eventId: normalizeString(eventId),
      properties: normalizeProperties(properties),
    });
  },

  trackContentEvent(
    name: TikTokContentEventName,
    properties?: TikTokContentEventProperties,
    eventId?: string
  ) {
    getNativeModule().trackContentEvent(
      normalizeContentEvent(name, properties, eventId)
    );
  },

  trackCustomEvent(
    name: string,
    properties?: TikTokPropertyMap,
    eventId?: string
  ) {
    getNativeModule().trackEvent({
      name: requireString(name, 'TikTok event name cannot be empty.'),
      eventId: normalizeString(eventId),
      properties: normalizeProperties(properties),
    });
  },

  trackAdRevenueEvent(adRevenue: TikTokPropertyMap, eventId?: string) {
    getNativeModule().trackEvent({
      name: TikTokStandardEventNames.ImpressionLevelAdRevenue,
      eventId: normalizeString(eventId),
      properties: normalizeProperties(adRevenue),
    });
  },

  fetchDeferredDeepLink() {
    return getNativeModule().fetchDeferredDeepLink();
  },
};

export default TikTokAppEventsModule;

export type {
  TikTokContent,
  TikTokContentEventProperties,
  TikTokIdentity,
  TikTokInitializeOptions,
} from './specs/TikTokAppEvents.nitro';
