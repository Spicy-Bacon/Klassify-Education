import SwiftUI

struct AnnouncementListView: View {
    let service: ParentAppService
    let session: ParentSession

    var body: some View {
        Group {
            if let announcements = try? service.inbox(session: session) {
                if announcements.isEmpty {
                    EmptyStateView(message: "No announcements yet.")
                } else {
                    List(announcements) { announcement in
                        NavigationLink(value: announcement) {
                            AnnouncementSummaryRow(announcement: announcement)
                        }
                    }
                    .navigationDestination(for: ParentAnnouncement.self) { announcement in
                        AnnouncementDetailView(service: service, session: session, announcementId: announcement.id)
                    }
                }
            } else {
                ErrorStateView(message: "Announcements could not be loaded.")
            }
        }
        .navigationTitle("Announcements")
    }
}

struct AnnouncementSummaryRow: View {
    let announcement: ParentAnnouncement

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(announcement.title)
                    .fontWeight(announcement.readAt == nil ? .bold : .regular)
                Spacer()
                Text(announcement.readAt == nil ? "Unread" : "Read")
                    .font(.caption.bold())
            }
            Text(announcement.publishedAt)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(announcement.audienceLabel)
                .font(.caption)
        }
        .accessibilityElement(children: .combine)
    }
}
