import SwiftUI

struct ChildDetailView: View {
    let service: ParentAppService
    let session: ParentSession
    let childId: String

    var body: some View {
        Group {
            if let child = try? service.child(session: session, studentId: childId) {
                List {
                    Section {
                        Text(child.displayName)
                            .font(.title2.bold())
                    }
                    Section("School details") {
                        LabeledContent("Student number", value: child.studentNumber)
                        LabeledContent("Year", value: child.yearGroup)
                        LabeledContent("Class", value: child.className)
                        LabeledContent("School", value: "Demo School")
                    }
                }
            } else {
                ErrorStateView(message: "That child is not linked to this parent account.")
            }
        }
        .navigationTitle("Child")
    }
}
