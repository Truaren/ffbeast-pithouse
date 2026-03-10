const HID = require('node-hid');

console.log("=== ALL HID DEVICES ===");
let devices = HID.devices();
for (let d of devices) {
  const vid = d.vendorId ? `0x${d.vendorId.toString(16).padStart(4, '0')}` : 'none';
  const pid = d.productId ? `0x${d.productId.toString(16).padStart(4, '0')}` : 'none';
  const up = d.usagePage !== undefined ? `0x${d.usagePage.toString(16)}` : 'none';
  const u = d.usage !== undefined ? `0x${d.usage.toString(16)}` : 'none';
  console.log(`VID: ${vid} | PID: ${pid} | Product: ${d.product} | Manufacturer: ${d.manufacturer} | UsagePage: ${up} | Usage: ${u}`);
}
console.log("=======================");
