export interface GpioSettings {
    pin_mode: number[];
    button_mode: number[];
    extension_mode: number;
    spi_mode: number;
    spi_latch_mode: number;
    spi_latch_delay: number;
    spi_clk_pulse_length: number;
}
