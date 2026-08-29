import SwiftUI

struct SettingsView: View {
    let service: ParentAppService
    let session: ParentSession

    @AppStorage("parent.language") private var languageCode = LanguagePreference.english.rawValue

    var body: some View {
        Group {
            if let state = try? service.homeState(session: session) {
                Form {
                    Section("settings_parent_profile") {
                        Text(state.parent.displayName)
                        Text(state.parent.email)
                    }
                    Section("settings_language") {
                        Picker("settings_language", selection: $languageCode) {
                            ForEach(LanguagePreference.allCases) { preference in
                                Text(preference.label).tag(preference.rawValue)
                            }
                        }
                    }
                    Section("settings_build") {
                        LabeledContent("settings_version", value: "0.1.0-dev")
                        Text("settings_development_build")
                            .font(.caption.bold())
                            .foregroundStyle(.red)
                    }
                }
            } else {
                ErrorStateView(message: "Settings could not be loaded.")
            }
        }
        .navigationTitle("screen_settings")
    }
}
