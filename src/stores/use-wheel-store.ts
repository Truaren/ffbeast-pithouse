import {
  type DeviceState,
  WheelApi,
} from "@shubham0x13/ffbeast-wheel-webhid-api";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { formatDeviceId } from "@/utils";

interface WheelState {
  readonly api: WheelApi;
  isConnected: boolean;
  deviceState: DeviceState | null;
  deviceId: string | null;
}

type WheelStore = WheelState;

export const useWheelStore = create<WheelStore>()(
  subscribeWithSelector((set) => {
    if (!WheelApi.isSupported()) {
      return {
        api: null as unknown as WheelApi,
        isConnected: false,
        deviceState: null,
        deviceId: null,
      };
    }
    const api = new WheelApi();

    api.on("deviceConnected", async () => {
      try {
        const licenseData = await api.readFirmwareLicense();
        const formattedId = formatDeviceId(licenseData.deviceId);
        const firmwareVersion = `${licenseData.firmwareVersion.major}.${licenseData.firmwareVersion.minor}.${licenseData.firmwareVersion.patch}`;
        console.log(
          `Device Connected: ${formattedId}, Firmware Version: ${firmwareVersion}, IsRegistered: ${licenseData.isRegistered}`,
        );
        set({
          isConnected: true,
          deviceId: formattedId,
        });
      } catch (error) {
        console.error("Failed to read device license data on connect:", error);
      }
    });

    api.on("deviceDisconnected", () => {
      console.warn("Device Disconnected");
      set({ isConnected: false, deviceState: null, deviceId: null });
    });

    api.on("stateReceived", (state) => {
      set({ deviceState: state });
    });

    api
      .tryAutoConnect()
      .then((connected) => {
        console[connected ? "log" : "warn"](
          `Attempted auto-connect ${connected ? "succeeded" : "failed"}`,
        );
      })
      .catch((error) => {
        console.error("Auto-connect attempt failed:", error);
      });

    return {
      api,
      isConnected: false,
      deviceState: null,
      deviceId: null,
    };
  }),
);
