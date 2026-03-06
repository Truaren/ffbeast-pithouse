#include "mainwindow.h"
#include "ui_mainwindow.h"

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow){
    ui->setupUi(this);
    wheelApi.connect();

    setWindowTitle("Wheel communication sample");

    ui->position_slider->setStyleSheet(R"(
        QSlider::groove:horizontal:disabled {
            background: #bcbcbc; /* Groove color */
            height: 4px;
        }
        QSlider::handle:horizontal:disabled {
            background: #5a5a5a; /* Handle color */
            border: 1px solid #3a3a3a;
            width: 3px;
            margin: -5px 0; /* Align the handle */
        }
    )");

    ui->force_slider->setStyleSheet(R"(
        QSlider::groove:horizontal:disabled {
            background: #bcbcbc; /* Groove color */
            height: 4px;
        }
        QSlider::handle:horizontal:disabled {
            background: #5a5a5a; /* Handle color */
            border: 1px solid #3a3a3a;
            width: 3px;
            margin: -5px 0; /* Align the handle */
        }
    )");

    connect(timer, &QTimer::timeout, this, &MainWindow::update);

    timer->start(10);
    elapsedTimer.start();
}

MainWindow::~MainWindow(){
    delete ui;
}

void MainWindow::update(){
    DeviceStateTypeDef state = {};
    if (wheelApi.readState(&state) > 0){
        ui->position_slider->setValue(state.Position);
        ui->force_slider->setValue(state.Torque);
    }
    DirectControlTypeDef control = {};
    control.SpringForce = ui->spring_slider->value() * 100;
    control.ConstantForce = ui->constant_slider->value() * 100;
    control.PeriodicForce = ui->magnitude_slider->value() * 100 * sin(2.0f * M_PI * ui->frequency_spinbox->value() * ((double)elapsedTimer.elapsed()/1000));
    wheelApi.sendDirectControl(control);
}

void MainWindow::on_read_range_clicked(){
    EffectSettingsTypeDef effectSettings = {};
    if (wheelApi.readEffectSettings(&effectSettings)){
        ui->range_label->setText(QString::number(effectSettings.MotionRange));
    }
}

void MainWindow::on_send_strength_clicked(){
    wheelApi.sendUInt8SettingReport(SETTINGS_FIELD_TOTAL_EFFECT_STRENGTH,0,ui->strength_spinbox->value());
}

