import SwiftUI

struct KlassifyRootView: View {
    private let developmentService = DevelopmentParentComposition.createService()

    var body: some View {
        #if DEBUG
        if let session = developmentService.currentSession() {
            ParentRootView(service: developmentService, session: session)
        } else {
            AuthenticationNotConfiguredView()
        }
        #else
        AuthenticationNotConfiguredView()
        #endif
    }
}

struct AuthenticationNotConfiguredView: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("Klassify Education")
                .font(.title.bold())
            Text("Authentication is not configured.")
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

struct ParentRootView: View {
    let service: ParentAppService
    let session: ParentSession

    @State private var selectedChildId: String?

    var body: some View {
        TabView {
            NavigationStack {
                ParentHomeView(service: service, session: session, selectedChildId: $selectedChildId)
            }
            .tabItem { Label("Home", systemImage: "house") }

            NavigationStack {
                AnnouncementListView(service: service, session: session)
            }
            .tabItem { Label("Announcements", systemImage: "megaphone") }

            NavigationStack {
                ChildrenView(service: service, session: session, selectedChildId: $selectedChildId)
            }
            .tabItem { Label("Children", systemImage: "person.2") }

            NavigationStack {
                SettingsView(service: service, session: session)
            }
            .tabItem { Label("Settings", systemImage: "gearshape") }
        }
    }
}

