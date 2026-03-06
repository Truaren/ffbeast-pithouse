#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "wheel_api.h"
#include <QMainWindow>
#include <QTimer>
#include <QElapsedTimer>

QT_BEGIN_NAMESPACE
namespace Ui {
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();
    void update();

    QTimer *timer  = new QTimer(this);

    QElapsedTimer elapsedTimer;

private slots:
    void on_read_range_clicked();

    void on_send_strength_clicked();

private:
    Ui::MainWindow *ui;

    WheelApi wheelApi;
};
#endif // MAINWINDOW_H
