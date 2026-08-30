#include "klassify/core/version.hpp"

#include <QApplication>
#include <QLabel>
#include <QVBoxLayout>
#include <QWidget>

int main(int argc, char* argv[])
{
    QApplication app(argc, argv);

    QWidget window;
    window.setWindowTitle("Klassify");

    auto* layout = new QVBoxLayout(&window);
    auto* title = new QLabel("Klassify");
    auto* status = new QLabel("Development Build");
    auto* coreVersion = new QLabel(
        QString("Core %1").arg(QString::fromStdString(klassify::core::version())));

    title->setAlignment(Qt::AlignCenter);
    status->setAlignment(Qt::AlignCenter);
    coreVersion->setAlignment(Qt::AlignCenter);

    layout->addWidget(title);
    layout->addWidget(status);
    layout->addWidget(coreVersion);

    window.resize(420, 220);
    window.show();

    return app.exec();
}
