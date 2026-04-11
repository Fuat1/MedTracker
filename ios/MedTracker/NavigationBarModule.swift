import Foundation
import UIKit

@objc(NavigationBarModule)
class NavigationBarModule: NSObject {

  /// Returns the navigation mode inferred from the key window's bottom safe area inset.
  ///   "gesture"  — Face ID device with home indicator (inset > 0)
  ///   "unknown"  — Home-button device (inset == 0); no software nav bar present
  @objc func getNavigationMode(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let inset: CGFloat
      if #available(iOS 15.0, *) {
        inset = UIApplication.shared.connectedScenes
          .compactMap { $0 as? UIWindowScene }
          .first?.windows
          .first(where: { $0.isKeyWindow })?.safeAreaInsets.bottom ?? 0
      } else {
        inset = UIApplication.shared.windows
          .first(where: { $0.isKeyWindow })?.safeAreaInsets.bottom ?? 0
      }
      resolve(inset > 0 ? "gesture" : "unknown")
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
