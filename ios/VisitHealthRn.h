#import <React/RCTBridgeModule.h>
#import <HealthKit/HealthKit.h>
#import <React/RCTEventEmitter.h>

@interface VisitHealthRn : RCTEventEmitter <RCTBridgeModule>{
  NSCalendar* calendar;
  NSUInteger bmrCaloriesPerHour;
  NSString *gender;
  BOOL hasLoadedOnce;
}

@property (nonatomic) HKHealthStore *healthStore;
+ (HKHealthStore *)sharedManager;
- (void)renderGraph:(NSDictionary *)input callback:(RCTResponseSenderBlock)callback;
- (void)updateApiUrl:(NSDictionary *)input;
- (void)connectToAppleHealth:(RCTResponseSenderBlock)callback;

@end
