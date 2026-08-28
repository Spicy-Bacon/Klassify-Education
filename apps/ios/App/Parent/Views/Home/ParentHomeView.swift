import SwiftUI

struct ParentHomeView: View {
    let service: ParentAppService
    let session: ParentSession
    @Binding var selectedChildId: String?

    var body: some View {
        Group {
            if let state = try? service.homeState(session: session, selectedChildId: selectedChildId) {
                List {
                    Section {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Klassify Education")
                                .font(.title2.bold())
                            Text("DEVELOPMENT ONLY parent session")
                                .font(.caption.bold())
                                .foregroundStyle(.red)
                            Text("Good morning, \(state.parent.displayName)")
                        }
                    }

                    if !state.children.isEmpty {
                        Section("Child context") {
                            Picker("Child", selection: Binding(get: {
                                selectedChildId ?? state.selectedChild?.studentId ?? state.children.first?.studentId
                            }, set: { selectedChildId = $0 })) {
                                ForEach(state.children) { child in
                                    Text("\(child.displayName) \(child.className)").tag(Optional(child.studentId))
                                }
                            }
                        }
                    }

                    Section("Unread announcements") {
                        Text("\(state.unreadCount)")
                            .font(.title.bold())
                            .accessibilityLabel("\(state.unreadCount) unread announcements")
                    }

                    Section("Latest announcements") {
                        ForEach(state.announcements.prefix(3)) { announcement in
                            NavigationLink(value: announcement) {
                                AnnouncementSummaryRow(announcement: announcement)
                            }
                        }
                    }

                    Section("Your children") {
                        ForEach(state.children) { child in
                            Text("\(child.displayName) - \(child.className)")
                        }
                    }

                    Section("Action Required") {
                        Text("Forms coming soon")
                            .foregroundStyle(.secondary)
                    }
                }
                .navigationTitle("Home")
                .navigationDestination(for: ParentAnnouncement.self) { announcement in
                    AnnouncementDetailView(service: service, session: session, announcementId: announcement.id)
                }
            } else {
                ErrorStateView(message: "Parent home could not be loaded.")
            }
        }
    }
}
