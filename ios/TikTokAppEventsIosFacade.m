#import "TikTokAppEventsIosFacade.h"

#import <TikTokBusinessSDK/TikTokBusinessSDK.h>

static NSString *const TikTokAppEventsErrorDomain =
    @"com.joeandthejuice.react-native-nitro-tiktok-business-sdk";
static BOOL TikTokAppEventsSdkConfigured = NO;

@implementation TikTokAppEventsIosFacade

+ (BOOL)isInitialized {
  return [TikTokBusiness isInitialized] || TikTokAppEventsSdkConfigured;
}

+ (void)initializeWithOptions:(NSDictionary<NSString *, id> *)options
                   completion:(TikTokAppEventsInitializeCompletion)completion {
  [self runOnMain:^{
    if ([self isInitialized]) {
      completion(YES, nil);
      return;
    }

    NSString *accessToken = [self normalizedString:options[@"accessToken"]];
    NSString *appId = [self normalizedString:options[@"appId"]];
    NSArray<NSString *> *tikTokAppIds =
        [options[@"tikTokAppIds"] isKindOfClass:[NSArray class]]
            ? options[@"tikTokAppIds"]
            : nil;

    if (accessToken == nil || appId == nil || tikTokAppIds.count == 0) {
      completion(
          NO,
          [self errorWithMessage:
                    @"TikTok initialization requires accessToken, appId, and at least one TikTok App ID."]);
      return;
    }

    TikTokConfig *config = [TikTokConfig
        configWithAccessToken:accessToken
                        appId:appId
                  tiktokAppId:[tikTokAppIds componentsJoinedByString:@","]];

    if (config == nil) {
      completion(NO, [self errorWithMessage:@"Failed to create TikTokConfig."]);
      return;
    }

    NSNumber *trackingEnabledOption = [self numberValue:options[@"trackingEnabled"]];
    BOOL trackingEnabled = trackingEnabledOption == nil ? YES : trackingEnabledOption.boolValue;

    [self applyBooleanOption:@"trackingEnabled"
                 fromOptions:options
                     ifFalse:^{
                       [config disableTracking];
                     }
                      ifTrue:nil];
    [self applyBooleanOption:@"automaticTrackingEnabled"
                 fromOptions:options
                     ifFalse:^{
                       [config disableAutomaticTracking];
                     }
                      ifTrue:nil];
    [self applyBooleanOption:@"installTrackingEnabled"
                 fromOptions:options
                     ifFalse:^{
                       [config disableInstallTracking];
                     }
                      ifTrue:nil];
    [self applyBooleanOption:@"launchTrackingEnabled"
                 fromOptions:options
                     ifFalse:^{
                       [config disableLaunchTracking];
                     }
                      ifTrue:nil];
    [self applyBooleanOption:@"retentionTrackingEnabled"
                 fromOptions:options
                     ifFalse:^{
                       [config disableRetentionTracking];
                     }
                      ifTrue:nil];
    [self applyBooleanOption:@"purchaseTrackingEnabled"
                 fromOptions:options
                     ifFalse:^{
                       [config disablePaymentTracking];
                     }
                      ifTrue:^{
                        [config enablePaymentTracking];
                      }];
    [self applyBooleanOption:@"skAdNetworkSupportEnabled"
                 fromOptions:options
                     ifFalse:^{
                       [config disableSKAdNetworkSupport];
                     }
                      ifTrue:nil];
    [self applyBooleanOption:@"enhancedDataPostbackEnabled"
                 fromOptions:options
                     ifFalse:^{
                       [config disableAutoEnhancedDataPostbackEvent];
                     }
                      ifTrue:nil];
    [self applyBooleanOption:@"lowPerformanceDevice"
                 fromOptions:options
                     ifFalse:nil
                      ifTrue:^{
                        [config setIsLowPerformanceDevice:YES];
                      }];
    [self applyBooleanOption:@"debugModeEnabled"
                 fromOptions:options
                     ifFalse:nil
                      ifTrue:^{
                        [config enableDebugMode];
                      }];
    [self applyBooleanOption:@"limitedDataUseEnabled"
                 fromOptions:options
                     ifFalse:nil
                      ifTrue:^{
                        [config enableLDUMode];
                      }];

    NSNumber *delayForATT = [self numberValue:options[@"delayForATTUserAuthorizationSeconds"]];
    if (delayForATT != nil) {
      [config setDelayForATTUserAuthorizationInSeconds:delayForATT.longValue];
    }

    NSString *customUserAgent = [self normalizedString:options[@"customUserAgent"]];
    if (customUserAgent != nil) {
      [config setCustomUserAgent:customUserAgent];
    }

    NSString *logLevel = [self normalizedString:options[@"logLevel"]];
    if (logLevel != nil) {
      [config setLogLevel:[self logLevelFromString:logLevel]];
    }

    [TikTokBusiness initializeSdk:config
                completionHandler:^(BOOL success, NSError *_Nullable error) {
                  if (success) {
                    TikTokAppEventsSdkConfigured = YES;
                    completion(YES, nil);
                    return;
                  }

                  if (!trackingEnabled &&
                      [self isDelayedTrackingInitializationError:error]) {
                    TikTokAppEventsSdkConfigured = YES;
                    completion(YES, nil);
                    return;
                  }

                  completion(NO, error);
                }];
  }];
}

+ (void)startTracking {
  [self runOnMain:^{
    [TikTokBusiness setTrackingEnabled:YES];
  }];
}

+ (void)identifyWithIdentity:(NSDictionary<NSString *, id> *)identity {
  [self runOnMain:^{
    [TikTokBusiness identifyWithExternalID:[self normalizedString:identity[@"externalId"]]
                          externalUserName:[self normalizedString:identity[@"externalUserName"]]
                               phoneNumber:[self normalizedString:identity[@"phoneNumber"]]
                                     email:[self normalizedEmail:identity[@"email"]]];
  }];
}

+ (void)logout {
  [self runOnMain:^{
    [TikTokBusiness logout];
  }];
}

+ (void)trackEventWithName:(NSString *)name
                properties:(NSDictionary<NSString *, id> *)properties
                   eventId:(nullable NSString *)eventId {
  [self runOnMain:^{
    TikTokBaseEvent *event =
        [[TikTokBaseEvent alloc] initWithEventName:name
                                        properties:properties ?: @{}
                                           eventId:eventId];
    [TikTokBusiness trackTTEvent:event];
  }];
}

+ (void)fetchDeferredDeepLinkWithCompletion:
    (TikTokAppEventsDeferredDeepLinkCompletion)completion {
  [self runOnMain:^{
    [TikTokBusiness fetchDeferredDeeplinkWithCompletion:^(
                        NSURL *_Nullable url, NSError *_Nullable error) {
      completion(url.absoluteString, error);
    }];
  }];
}

+ (void)runOnMain:(dispatch_block_t)block {
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_async(dispatch_get_main_queue(), block);
  }
}

+ (NSError *)errorWithMessage:(NSString *)message {
  return [NSError errorWithDomain:TikTokAppEventsErrorDomain
                             code:-1
                         userInfo:@{NSLocalizedDescriptionKey : message}];
}

+ (BOOL)isDelayedTrackingInitializationError:(NSError *_Nullable)error {
  if (error == nil) {
    return NO;
  }

  if (error.code != -1) {
    return NO;
  }

  NSString *message = error.localizedDescription.lowercaseString;
  return [message containsString:@"tracking not enabled"] &&
         [message containsString:@"sdk not initialized"];
}

+ (NSString *_Nullable)normalizedString:(id)value {
  if (![value isKindOfClass:[NSString class]]) {
    return nil;
  }

  NSString *trimmed =
      [(NSString *)value stringByTrimmingCharactersInSet:
                           [NSCharacterSet whitespaceAndNewlineCharacterSet]];
  return trimmed.length > 0 ? trimmed : nil;
}

+ (NSString *_Nullable)normalizedEmail:(id)value {
  NSString *normalized = [self normalizedString:value];
  return normalized.lowercaseString;
}

+ (NSNumber *_Nullable)numberValue:(id)value {
  return [value isKindOfClass:[NSNumber class]] ? value : nil;
}

+ (void)applyBooleanOption:(NSString *)key
               fromOptions:(NSDictionary<NSString *, id> *)options
                   ifFalse:(dispatch_block_t _Nullable)ifFalse
                    ifTrue:(dispatch_block_t _Nullable)ifTrue {
  NSNumber *value = [self numberValue:options[key]];
  if (value == nil) {
    return;
  }

  if (value.boolValue) {
    if (ifTrue != nil) {
      ifTrue();
    }
  } else if (ifFalse != nil) {
    ifFalse();
  }
}

+ (TikTokLogLevel)logLevelFromString:(NSString *)value {
  NSString *normalized = value.lowercaseString;
  if ([normalized isEqualToString:@"verbose"]) {
    return TikTokLogLevelVerbose;
  }
  if ([normalized isEqualToString:@"debug"]) {
    return TikTokLogLevelDebug;
  }
  if ([normalized isEqualToString:@"warn"]) {
    return TikTokLogLevelWarn;
  }
  if ([normalized isEqualToString:@"error"]) {
    return TikTokLogLevelError;
  }
  if ([normalized isEqualToString:@"assert"]) {
    return TikTokLogLevelAssert;
  }
  if ([normalized isEqualToString:@"info"]) {
    return TikTokLogLevelInfo;
  }
  return TikTokLogLevelSuppress;
}

@end
