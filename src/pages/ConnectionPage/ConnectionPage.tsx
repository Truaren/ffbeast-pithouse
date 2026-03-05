import "./style.scss";

import { Button } from "@components/ui";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { useWheelStore } from "@/stores";

export const ConnectionPage = () => {
  const { api, isConnected } = useWheelStore(
    useShallow((state) => ({
      api: state.api,
      isConnected: state.isConnected,
    })),
  );

  if (isConnected) return null;

  return (
    <div className="connection_page">
      <div className="connection_container">
        <div className="connection_content">
          <div className="brand_section">
            <h1 className="brand_title">FFBeast</h1>
            <span className="brand_version">V{__APP_VERSION__}</span>
          </div>

          <div className="connection_card">
            <div className="status_indicator">
              <div className="status_dot"></div>
              <span className="status_text">Waiting for device</span>
            </div>

            <div className="connection_info">
              <h2 className="connection_title">Connect Your Wheel</h2>
              <p className="connection_description">
                Connect your steering wheel via USB to begin configuring force
                feedback settings
              </p>
            </div>

            <div className="connection_steps">
              <div className="step">
                <div className="step_number">1</div>
                <span>Power on your device</span>
              </div>
              <div className="step">
                <div className="step_number">2</div>
                <span>Connect via USB cable</span>
              </div>
              <div className="step">
                <div className="step_number">3</div>
                <span>Press Connect</span>
              </div>
              <div className="step">
                <div className="step_number">4</div>
                <span>Select Device</span>
              </div>
            </div>

            <Button
              variant="primary"
              style={{
                margin: "0rem",
              }}
              onClick={() => {
                api
                  .connect()
                  .then((connected) => {
                    console[connected ? "log" : "warn"](
                      `Manual connect ${connected ? "succeeded" : "failed"}`,
                    );
                    toast.info(
                      connected
                        ? "Device connected successfully!"
                        : "No device selected or connection failed.",
                    );
                  })
                  .catch((error) => {
                    console.error("Manual connect failed:", error);
                    toast.error(
                      "Connection failed: " + (error as Error).message,
                    );
                  });
              }}
            >
              Connect Device
            </Button>
          </div>

          <div className="footer_info">
            <i className="icon fi fi-sr-info"></i>
            <span>Ensure your device drivers are installed and up to date</span>
          </div>
        </div>
      </div>
    </div>
  );
};
