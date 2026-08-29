import SwiftUI

struct FormListView: View {
    let service: ParentAppService
    let session: ParentSession

    var body: some View {
        Group {
            if let forms = try? service.forms(session: session) {
                if forms.isEmpty {
                    EmptyStateView(message: String(localized: "empty_forms"))
                } else {
                    List(forms) { form in
                        NavigationLink(value: form) {
                            FormSummaryRow(form: form)
                        }
                    }
                    .navigationDestination(for: ParentFormTask.self) { form in
                        FormDetailView(service: service, session: session, recipientId: form.recipientId)
                    }
                }
            } else {
                ErrorStateView(message: "Forms could not be loaded.")
            }
        }
        .navigationTitle("screen_forms")
    }
}

struct FormSummaryRow: View {
    let form: ParentFormTask

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(form.title)
                    .fontWeight(form.status == .outstanding ? .bold : .regular)
                Spacer()
                Text(statusLabel(form.status))
                    .font(.caption.bold())
            }
            Text(form.child.map { "\($0.displayName) - \($0.className)" } ?? "Family-level form")
                .font(.caption)
            Text(form.deadlineAt.map { "Due \($0)" } ?? "No deadline")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }

    private func statusLabel(_ status: ParentFormStatus) -> String {
        switch status {
        case .outstanding:
            return "Outstanding"
        case .submitted:
            return "Submitted"
        case .closed:
            return "Closed"
        }
    }
}