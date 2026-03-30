#import "TikTokAppEventsIosFacade.h"

#include "HybridTikTokAppEvents.hpp"

#include <algorithm>
#include <cctype>
#include <stdexcept>
#include <utility>

using namespace margelo::nitro;

namespace margelo::nitro::tiktokappevents {

namespace {

NSString *toNSString(const std::string &value) {
  return [[NSString alloc] initWithBytes:value.data()
                                  length:value.size()
                                encoding:NSUTF8StringEncoding];
}

std::string toStdString(NSString *value) {
  if (value == nil) {
    return "";
  }

  const char *utf8String = value.UTF8String;
  return utf8String != nullptr ? std::string(utf8String) : std::string();
}

std::exception_ptr makeException(NSString *message) {
  NSString *resolvedMessage = message ?: @"Unknown TikTok iOS error.";
  return std::make_exception_ptr(std::runtime_error(toStdString(resolvedMessage)));
}

NSString *toNullableNSString(const std::optional<std::string> &value) {
  if (!value.has_value()) {
    return nil;
  }

  return toNSString(*value);
}

NSNumber *toNullableBoolNumber(const std::optional<bool> &value) {
  return value.has_value() ? @(value.value()) : nil;
}

NSNumber *toNullableDoubleNumber(const std::optional<double> &value) {
  return value.has_value() ? @(value.value()) : nil;
}

NSArray<NSString *> *toNSStringArray(const std::vector<std::string> &values) {
  NSMutableArray<NSString *> *result =
      [[NSMutableArray alloc] initWithCapacity:values.size()];
  for (const auto &value : values) {
    [result addObject:toNSString(value)];
  }
  return result;
}

NSArray<NSString *> *toNullableNSStringArray(
    const std::optional<std::vector<std::string>> &values) {
  if (!values.has_value()) {
    return nil;
  }

  return toNSStringArray(*values);
}

id anyValueToNSObject(const AnyValue &value);

NSArray *anyArrayToNSArray(const AnyArray &array) {
  NSMutableArray *result = [[NSMutableArray alloc] initWithCapacity:array.size()];
  for (const auto &item : array) {
    [result addObject:anyValueToNSObject(item)];
  }
  return result;
}

NSDictionary<NSString *, id> *anyObjectToNSDictionary(const AnyObject &object) {
  NSMutableDictionary<NSString *, id> *result =
      [[NSMutableDictionary alloc] initWithCapacity:object.size()];
  for (const auto &[key, value] : object) {
    result[toNSString(key)] = anyValueToNSObject(value);
  }
  return result;
}

id anyValueToNSObject(const AnyValue &value) {
  return std::visit(
      [](const auto &typedValue) -> id {
        using ValueType = std::decay_t<decltype(typedValue)>;
        if constexpr (std::is_same_v<ValueType, NullType>) {
          return [NSNull null];
        } else if constexpr (std::is_same_v<ValueType, bool>) {
          return @(typedValue);
        } else if constexpr (std::is_same_v<ValueType, double>) {
          return @(typedValue);
        } else if constexpr (std::is_same_v<ValueType, int64_t>) {
          return [NSNumber numberWithLongLong:typedValue];
        } else if constexpr (std::is_same_v<ValueType, std::string>) {
          return toNSString(typedValue);
        } else if constexpr (std::is_same_v<ValueType, AnyArray>) {
          return anyArrayToNSArray(typedValue);
        } else if constexpr (std::is_same_v<ValueType, AnyObject>) {
          return anyObjectToNSDictionary(typedValue);
        }
      },
      static_cast<const VariantType &>(value));
}

NSDictionary<NSString *, id> *anyMapToNSDictionary(
    const std::shared_ptr<AnyMap> &map) {
  if (map == nullptr) {
    return @{};
  }

  auto keys = map->getAllKeys();
  NSMutableDictionary<NSString *, id> *result =
      [[NSMutableDictionary alloc] initWithCapacity:keys.size()];
  for (const auto &key : keys) {
    result[toNSString(key)] = anyValueToNSObject(map->getAny(key));
  }
  return result;
}

std::string trimString(const std::string &value) {
  auto isWhitespace = [](unsigned char c) { return std::isspace(c) != 0; };
  auto start = std::find_if_not(value.begin(), value.end(), isWhitespace);
  if (start == value.end()) {
    return "";
  }

  auto end = std::find_if_not(value.rbegin(), value.rend(), isWhitespace).base();
  return std::string(start, end);
}

} // namespace

std::shared_ptr<Promise<void>>
HybridTikTokAppEvents::initialize(const TikTokInitializeOptions &options) {
  if ([TikTokAppEventsIosFacade isInitialized]) {
    return Promise<void>::resolved();
  }

  auto promise = Promise<void>::create();
  auto retainedPromise = promise;

  NSMutableDictionary<NSString *, id> *nativeOptions = [[NSMutableDictionary alloc] init];
  nativeOptions[@"accessToken"] = toNSString(options.accessToken);
  if (NSString *appId = toNullableNSString(options.appId)) {
    nativeOptions[@"appId"] = appId;
  }
  if (NSArray<NSString *> *tikTokAppIds =
          toNullableNSStringArray(options.tikTokAppIds)) {
    nativeOptions[@"tikTokAppIds"] = tikTokAppIds;
  }

  if (NSNumber *value = toNullableBoolNumber(options.trackingEnabled)) {
    nativeOptions[@"trackingEnabled"] = value;
  }
  if (NSNumber *value =
          toNullableBoolNumber(options.automaticTrackingEnabled)) {
    nativeOptions[@"automaticTrackingEnabled"] = value;
  }
  if (NSNumber *value = toNullableBoolNumber(options.installTrackingEnabled)) {
    nativeOptions[@"installTrackingEnabled"] = value;
  }
  if (NSNumber *value = toNullableBoolNumber(options.launchTrackingEnabled)) {
    nativeOptions[@"launchTrackingEnabled"] = value;
  }
  if (NSNumber *value = toNullableBoolNumber(options.retentionTrackingEnabled)) {
    nativeOptions[@"retentionTrackingEnabled"] = value;
  }
  if (NSNumber *value = toNullableBoolNumber(options.purchaseTrackingEnabled)) {
    nativeOptions[@"purchaseTrackingEnabled"] = value;
  }
  if (NSNumber *value =
          toNullableBoolNumber(options.skAdNetworkSupportEnabled)) {
    nativeOptions[@"skAdNetworkSupportEnabled"] = value;
  }
  if (NSNumber *value =
          toNullableBoolNumber(options.enhancedDataPostbackEnabled)) {
    nativeOptions[@"enhancedDataPostbackEnabled"] = value;
  }
  if (NSNumber *value = toNullableBoolNumber(options.lowPerformanceDevice)) {
    nativeOptions[@"lowPerformanceDevice"] = value;
  }
  if (NSNumber *value = toNullableBoolNumber(options.debugModeEnabled)) {
    nativeOptions[@"debugModeEnabled"] = value;
  }
  if (NSNumber *value = toNullableBoolNumber(options.limitedDataUseEnabled)) {
    nativeOptions[@"limitedDataUseEnabled"] = value;
  }
  if (NSNumber *value =
          toNullableDoubleNumber(options.delayForATTUserAuthorizationSeconds)) {
    nativeOptions[@"delayForATTUserAuthorizationSeconds"] = value;
  }
  if (NSString *value = toNullableNSString(options.customUserAgent)) {
    nativeOptions[@"customUserAgent"] = value;
  }
  if (NSString *value = toNullableNSString(options.logLevel)) {
    nativeOptions[@"logLevel"] = value;
  }

  [TikTokAppEventsIosFacade
      initializeWithOptions:nativeOptions
                 completion:^(BOOL success, NSError *_Nullable error) {
                   if (success) {
                     retainedPromise->resolve();
                   } else {
                     retainedPromise->reject(makeException(
                         error.localizedDescription
                             ?: @"TikTok SDK initialization failed."));
                   }
                 }];

  return promise;
}

void HybridTikTokAppEvents::startTracking() {
  [TikTokAppEventsIosFacade startTracking];
}

void HybridTikTokAppEvents::identify(const TikTokIdentity &identity) {
  NSMutableDictionary<NSString *, id> *nativeIdentity =
      [[NSMutableDictionary alloc] init];

  if (auto value = normalizeString(identity.externalId)) {
    nativeIdentity[@"externalId"] = toNSString(*value);
  }
  if (auto value = normalizeString(identity.externalUserName)) {
    nativeIdentity[@"externalUserName"] = toNSString(*value);
  }
  if (auto value = normalizeString(identity.phoneNumber)) {
    nativeIdentity[@"phoneNumber"] = toNSString(*value);
  }
  if (auto value = normalizeEmail(identity.email)) {
    nativeIdentity[@"email"] = toNSString(*value);
  }

  [TikTokAppEventsIosFacade identifyWithIdentity:nativeIdentity];
}

void HybridTikTokAppEvents::logout() {
  [TikTokAppEventsIosFacade logout];
}

void HybridTikTokAppEvents::trackEvent(const TikTokEvent &event) {
  auto normalizedName = normalizeString(std::optional<std::string>(event.name));
  if (!normalizedName.has_value()) {
    throw std::invalid_argument("TikTok event name cannot be empty.");
  }

  NSDictionary<NSString *, id> *properties =
      event.properties.has_value() ? anyMapToNSDictionary(*event.properties) : @{};
  NSString *eventId = nil;
  if (auto normalizedEventId = normalizeString(event.eventId)) {
    eventId = toNSString(*normalizedEventId);
  }

  [TikTokAppEventsIosFacade trackEventWithName:toNSString(*normalizedName)
                                    properties:properties
                                       eventId:eventId];
}

std::shared_ptr<Promise<std::optional<std::string>>>
HybridTikTokAppEvents::fetchDeferredDeepLink() {
  auto promise = Promise<std::optional<std::string>>::create();
  auto retainedPromise = promise;

  [TikTokAppEventsIosFacade
      fetchDeferredDeepLinkWithCompletion:^(NSString *_Nullable url,
                                            NSError *_Nullable error) {
        if (error != nil) {
          retainedPromise->reject(makeException(error.localizedDescription));
          return;
        }

        if (url == nil) {
          retainedPromise->resolve(std::nullopt);
          return;
        }

        retainedPromise->resolve(std::optional<std::string>(toStdString(url)));
      }];

  return promise;
}

std::optional<std::string> HybridTikTokAppEvents::normalizeString(
    const std::optional<std::string> &value) {
  if (!value.has_value()) {
    return std::nullopt;
  }

  auto trimmed = trimString(*value);
  if (trimmed.empty()) {
    return std::nullopt;
  }

  return trimmed;
}

std::optional<std::string> HybridTikTokAppEvents::normalizeEmail(
    const std::optional<std::string> &value) {
  auto normalized = normalizeString(value);
  if (!normalized.has_value()) {
    return std::nullopt;
  }

  std::string lowercased = *normalized;
  std::transform(lowercased.begin(), lowercased.end(), lowercased.begin(),
                 [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
  return lowercased;
}

} // namespace margelo::nitro::tiktokappevents
