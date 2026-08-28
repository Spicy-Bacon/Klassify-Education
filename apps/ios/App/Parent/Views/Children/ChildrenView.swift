import SwiftUI

struct ChildrenView: View {
    let service: ParentAppService
    let session: ParentSession
    @Binding var selectedChildId: String?

    var body: some View {
        Group {
            if let children = try? service.linkedChildren(session: session) {
                if children.isEmpty {
                    EmptyStateView(message: String(localized: "empty_children"))
                } else {
                    List(children) { child in
                        NavigationLink(value: child) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(child.displayName)
                                    .font(.headline)
                                Text(child.yearGroup)
                                Text("Class \(child.className)")
                            }
                        }
                        .simultaneousGesture(TapGesture().onEnded { selectedChildId = child.studentId })
                    }
                    .navigationDestination(for: ChildSummary.self) { child in
                        ChildDetailView(service: service, session: session, childId: child.studentId)
                    }
                }
            } else {
                ErrorStateView(message: "Children could not be loaded.")
            }
        }
        .navigationTitle("screen_children")
    }
}
