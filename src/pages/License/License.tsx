import { useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

import { Button, InputBox } from "@/components/ui";
import { useWheelStore } from "@/stores";
import { formatSerialKey } from "@/utils";

export const License = () => {
  const { api, isConnected, deviceId } = useWheelStore(
    useShallow((state) => ({
      api: state.api,
      isConnected: state.isConnected,
      deviceId: state.deviceId,
    })),
  );

  const [serialKey, setSerialKey] = useState("");

  const handleActivate = async () => {
    if (!serialKey.trim() || serialKey.length !== 26) {
      toast.error("Please enter a valid serial key.");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your device before activating the license.");
      return;
    }

    const success = await api.sendFirmwareActivation(serialKey);
    if (success) {
      toast.success("Device activated successfully!");
      setSerialKey("");
    } else {
      toast.error("Activation failed. Please check the key and try again.");
    }
  };

  return (
    <div className="settings">
      <InputBox
        label="Device ID"
        value={deviceId ?? "Device not connected"}
        placeholder="00000000-00000000-00000000"
        readonly
      />
      <InputBox
        label="Serial Key"
        placeholder="00000000-00000000-00000000"
        value={serialKey}
        onValueChange={(value) => setSerialKey(formatSerialKey(value))}
      />

      <Button variant="primary" onClick={() => handleActivate()}>
        Activate
      </Button>
    </div>
  );
};
