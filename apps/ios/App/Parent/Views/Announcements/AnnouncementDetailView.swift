import SwiftUI

struct AnnouncementDetailView: View {
    let service: ParentAppService
    let session: ParentSession
    let announcementId: String

    @State private var announcement: ParentAnnouncement?
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if let announcement {
                List {
                    Section {
                        Text(announcement.title)
                            .font(.title2.bold())
                        Text("From \(announcement.authorDisplayName)")
                        Text(announcement.publishedAt)
                            .foregroundStyle(.secondary)
                        Text(announcement.audienceLabel)
                            .font(.caption.bold())
                    }
                    Section("Message") {
                        Text(announcement.body)
                    }
                }
            } else if let errorMessage {
                ErrorStateView(message: errorMessage)
            } else {
                ProgressView("Loading")
            }
        }
        .navigationTitle("Announcement")
        .task {
            do {
                announcement = try service.markAnnouncementRead(session: session, announcementId: announcementId)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
