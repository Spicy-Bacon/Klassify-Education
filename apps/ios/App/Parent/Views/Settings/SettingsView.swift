import SwiftUI

struct SettingsView: View {
    let service: ParentAppService
    let session: ParentSession

    @State private var language = LanguagePreference.english

    var body: some View {
        Group {
            if let state = try? service.homeState(session: session) {
                Form {
                    Section("Parent profile") {
                        Text(state.parent.displayName)
                        Text(state.parent.email)
                    }
                    Section("Selected language") {
                        Picker("Language", selection: $language) {
                            ForEach(LanguagePreference.allCases) { preference in
                                Text(preference.label).tag(preference)
                            }
                        }
                    }
                    Section("Build") {
                        LabeledContent("Version", value: "0.1.0-dev")
                        Text("Development build")
                            .font(.caption.bold())
                            .foregroundStyle(.red)
                    }
                }
            } else {
                ErrorStateView(message: "Settings could not be loaded.")
            }
        }
        .navigationTitle("Settings")
    }
}
