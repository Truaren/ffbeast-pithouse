export function formatSerialKey(value: string) {
  // Allow only alphanumeric
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // Split into chunks of 8
  const parts = cleaned.match(/.{1,8}/g) ?? [];

  // Limit to 3 parts
  return parts.slice(0, 3).join("-");
}

export function formatDeviceId(deviceId: number[]) {
  return deviceId
    .map((part) => part.toString(16).toUpperCase().padStart(8, "0"))
    .join("-");
}
