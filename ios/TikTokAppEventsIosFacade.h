#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^TikTokAppEventsInitializeCompletion)(BOOL success, NSError *_Nullable error);
typedef void (^TikTokAppEventsDeferredDeepLinkCompletion)(NSString *_Nullable url, NSError *_Nullable error);

@interface TikTokAppEventsIosFacade : NSObject

+ (BOOL)isInitialized;
+ (void)initializeWithOptions:(NSDictionary<NSString *, id> *)options
                   completion:(TikTokAppEventsInitializeCompletion)completion;
+ (void)startTracking;
+ (void)identifyWithIdentity:(NSDictionary<NSString *, id> *)identity;
+ (void)logout;
+ (void)trackEventWithName:(NSString *)name
                properties:(NSDictionary<NSString *, id> *)properties
                   eventId:(nullable NSString *)eventId;
+ (void)fetchDeferredDeepLinkWithCompletion:
    (TikTokAppEventsDeferredDeepLinkCompletion)completion;

@end

NS_ASSUME_NONNULL_END
