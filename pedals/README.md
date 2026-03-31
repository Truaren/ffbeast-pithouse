# How To Make A Pedal Folder

This guide is for someone who just wants to copy, paste, change a few things, and make their own pedal folder.

Do not worry about understanding the code.

Just follow the steps in order.

## 1. Copy a pedal folder

1. Copy this whole folder.
2. Rename the folder to the name of your pedals.

Example:

- `Logitech G920 Pedals`
- `Moza Pedals`
- `My USB Pedals`

## 2. Open `index.js`

Inside the copied folder, open:

```text
index.js
```

You only need to change 3 parts.

## 3. Change the device ID

At the top of the file, find this part:

```js
const DEVICE_INFO = {
  vendorId: 0x1209,
  productId: 0xf00d,
  name: "Logitech G920 Pedals (Shifter/Pedals Adapter)",
};
```

Change those 3 lines for your own device.

## 4. How to get your `vendorId` and `productId`

Do this in Windows:

1. Plug in your pedals.
2. Open `Device Manager`.
3. Find your pedal device.
4. Right click it.
5. Click `Properties`.
6. Open the `Details` tab.
7. In the list, choose `Hardware Ids`.

You will see something like this:

```text
USB\VID_1209&PID_F00D
```

Copy it like this:

- `VID_1209` becomes `vendorId: 0x1209`
- `PID_F00D` becomes `productId: 0xf00d`

Also change the `name` to whatever you want.

Example:

```js
const DEVICE_INFO = {
  vendorId: 0x1234,
  productId: 0xabcd,
  name: "My Pedals",
};
```

## 5. Change the pedal max numbers

Find this part:

```js
const DEFAULT_RAW_LIMITS = {
  throtl_min: 0,
  throtl_max: 4095,
  brake_min: 0,
  brake_max: 4095,
  clutch_min: 0,
  clutch_max: 4095,
};
```

You normally only need to change the biggest number.

## 6. How to choose the biggest number

Use the highest raw number your pedal reaches.

Common values:

- `255`
- `1023`
- `4095`
- `65535`

Use the one your pedals reach.

Example:

- if the pedal goes up to `4095`, use `4095`
- if the pedal goes up to `65535`, use `65535`

## 7. How to find that number

Use the easiest method you have:

### Method A: If the app shows raw values

1. Open the app.
2. Press one pedal fully.
3. Look at the raw number.
4. Write down the highest number.

That is the max.

### Method B: Use a debug tool or script

If you have a tool that prints raw pedal numbers:

1. Press the pedal fully.
2. Watch the number.
3. Use the biggest number you see.

### Method C: Quick guess if you have nothing else

Try these in this order:

1. `4095`
2. `65535`

If the pedal does not reach full range correctly, try the other one.

## 8. Change the pedal reading part

Find this part:

```js
function parseRaw(buf) {
  const hasReportId = buf.length >= 14 && buf[0] === 0x01;
  const pedalBase = hasReportId ? 8 : 4;

  return {
    axis1: safeU16(buf, pedalBase),
    axis2: safeU16(buf, pedalBase + 2),
    axis3: safeU16(buf, pedalBase + 4),
  };
}
```

This part tells the app where to read:

- throttle
- brake
- clutch

## 9. If the wrong pedal moves

Leave the rest alone.

Only change these 3 lines:

```js
return {
  axis1: safeU16(buf, pedalBase),
  axis2: safeU16(buf, pedalBase + 2),
  axis3: safeU16(buf, pedalBase + 4),
};
```

Simple rule:

- `axis1` = throttle
- `axis2` = brake
- `axis3` = clutch

So if brake is showing up where throttle should be, swap them.

Example:

```js
return {
  axis1: safeU16(buf, pedalBase + 2),
  axis2: safeU16(buf, pedalBase),
  axis3: safeU16(buf, pedalBase + 4),
};
```

That swaps throttle and brake.

## 10. If the shifter moves instead of the pedals

That means the code is reading the wrong place.

You need to change:

```js
const pedalBase = hasReportId ? 8 : 4;
```

Try another starting place.

Example:

- `8`
- `6`
- `4`
- `10`

Then test again.

## 11. If a pedal works backwards

That means:

- pedal released = full
- pedal pressed = zero

If that happens, the axis needs to be inverted.

If needed, this can be changed later.

## 12. Save and test

Now do this:

1. Save `index.js`
2. Open the app
3. Test throttle
4. Test brake
5. Test clutch

## 13. Very short version

If you want the fastest possible version:

1. Copy a pedal folder.
2. Rename it.
3. Change `DEVICE_INFO`.
4. Change the max values in `DEFAULT_RAW_LIMITS`.
5. Fix `parseRaw()` if the wrong pedal moves.
6. Test.

## 14. Copy-paste example

If your device says:

```text
USB\VID_1234&PID_ABCD
```

and your pedals go to `65535`, use:

```js
const DEVICE_INFO = {
  vendorId: 0x1234,
  productId: 0xabcd,
  name: "My Pedals",
};

const DEFAULT_RAW_LIMITS = {
  throtl_min: 0,
  throtl_max: 65535,
  brake_min: 0,
  brake_max: 65535,
  clutch_min: 0,
  clutch_max: 65535,
};
```

## 15. Only remember this

If you forget everything else, only remember:

1. get `VID` and `PID`
2. get the max pedal number
3. fix `parseRaw()` until throttle, brake, and clutch match correctly
