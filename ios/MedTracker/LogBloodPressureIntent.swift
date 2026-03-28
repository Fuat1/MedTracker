import AppIntents
import UIKit

@available(iOS 16.0, *)
struct LogBloodPressureIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Blood Pressure"
    static var description = IntentDescription("Log a blood pressure reading in MedTracker")
    
    @Parameter(title: "Systolic")
    var systolic: Int
    
    @Parameter(title: "Diastolic")
    var diastolic: Int
    
    @Parameter(title: "Pulse")
    var pulse: Int?
    
    @MainActor
    func perform() async throws -> some IntentResult {
        var urlString = "medtracker://log?sys=\(systolic)&dia=\(diastolic)"
        if let p = pulse, p > 0 {
            urlString += "&pulse=\(p)"
        }
        
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
        
        return .result(dialog: "Opening MedTracker to confirm your reading.")
    }
}

@available(iOS 16.0, *)
struct MedTrackerAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: LogBloodPressureIntent(),
            phrases: [
                "Log my blood pressure in \(.applicationName)",
                "Add a reading in \(.applicationName)"
            ],
            shortTitle: "Log Blood Pressure",
            systemImageName: "heart.text.square"
        )
    }
}
