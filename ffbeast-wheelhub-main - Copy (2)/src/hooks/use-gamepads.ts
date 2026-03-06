import { useEffect, useRef, useState } from "react";

export interface GamepadState {
  id: string;
  connected: boolean;
  axes: readonly number[];
  buttons: readonly GamepadButton[];
}

export function useGamepads() {
  const [gamepads, setGamepads] = useState<Record<number, GamepadState>>({});
  const requestRef = useRef<number>(0);
  const lastStateRef = useRef<Record<number, GamepadState>>({});

  useEffect(() => {
    const updateGamepads = () => {
      const rawGamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let isDirty = false;
      const newGamepads: Record<number, GamepadState> = {};

      for (const gp of rawGamepads) {
        if (gp) {
          newGamepads[gp.index] = {
            id: gp.id,
            connected: gp.connected,
            axes: gp.axes,
            buttons: gp.buttons,
          };

          const lastGp = lastStateRef.current[gp.index];
          if (!lastGp) {
            isDirty = true;
          } else {
             for (let j = 0; j < gp.axes.length; j++) {
               if (Math.abs(gp.axes[j] - lastGp.axes[j]) > 0.01) {
                  isDirty = true;
                  // Temporary log for debugging
                  console.log(`[Gamepad] Axis ${j} moved. Last: ${lastGp.axes[j]}, Now: ${gp.axes[j]}`);
                  break;
               }
             }
          }
        }
      }

      if (isDirty) {
        lastStateRef.current = newGamepads;
        setGamepads(newGamepads);
      }

      requestRef.current = requestAnimationFrame(updateGamepads);
    };

    // Start loop
    requestRef.current = requestAnimationFrame(updateGamepads);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return gamepads;
}
