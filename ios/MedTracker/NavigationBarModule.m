#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NavigationBarModule, NSObject)

RCT_EXTERN_METHOD(
  getNavigationMode:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
