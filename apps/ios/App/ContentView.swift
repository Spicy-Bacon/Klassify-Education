import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("AI School Platform")
                .font(.largeTitle)
                .multilineTextAlignment(.center)

            VStack(spacing: 8) {
                Text("Connect")
                Text("Manage")
                Text("Capture")
            }
            .font(.title3)

            Text("Development Build")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
