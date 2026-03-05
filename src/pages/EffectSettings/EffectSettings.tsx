import { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";

import { Slider, ToggleSwitch } from "@/components/ui";
import { useSettingUI } from "@/hooks/use-setting-ui";
import { useDeviceSettingsStore } from "@/stores";

import "./style.scss";

export const EffectSettings = () => {
  const effects = useDeviceSettingsStore((state) => state.settings.effects);
  const setSetting = useSettingUI();

  return (
    <div className="effects_page">

      {/* EFFECTS PANEL */}
      <div className="effects_card">
        <div className="card_header">
          <i className="icon fi fi-sr-dial" />
          <h2>Effects</h2>
        </div>
        <div className="card_body">
          <Slider
            label="Motion Range (%)"
            value={effects.motionRange}
            max={2700}
            onValueCommit={(v) => setSetting(SettingField.MotionRange, v)}
            infoPanelProps={{
              description: "Determines how far you can physically turn the wheel. (e.g., 900° for road cars, 360° for F1).",
              impact: "Matches your physical steering lock to the car in-game.",
              animationType: "rotation",
              value: effects.motionRange,
            }}
          />
          <Slider
            label="Total Effect Strength (%)"
            value={effects.totalEffectStrength}
            onValueCommit={(v) => setSetting(SettingField.TotalEffectStrength, v)}
            infoPanelProps={{
              description: "The master gain control for all force feedback effects produced by the motor.",
              impact: "Lower this if the wheel feels dangerous or too heavy; raise it for maximum road detail.",
              animationType: "vibrate",
              value: effects.totalEffectStrength,
            }}
          />
          <Slider
            isPro
            label="Integrated Spring Strength (%)"
            value={effects.integratedSpringStrength}
            onValueCommit={(v) => setSetting(SettingField.IntegratedSpringStrength, v)}
            infoPanelProps={{
              description: "An always-on centering force that pulls the wheel back to the middle, ignoring game physics.",
              impact: "Necessary for old games without FFB. For modern sims, set to 0%.",
              animationType: "spring",
            }}
          />
          <Slider
            label="Static Dampening (%)"
            value={effects.staticDampeningStrength}
            onValueCommit={(v) => setSetting(SettingField.StaticDampeningStrength, v)}
            infoPanelProps={{
              description: "Adds constant weight to the steering, simulating mechanical friction and tire feel.",
              impact: "Stabilizes the wheel on straights. Too much makes steering feel muddy.",
              animationType: "dampen",
            }}
          />
          <Slider
            isPro
            label="Soft Stop Range (°)"
            value={effects.softStopRange}
            min={1}
            max={45}
            onValueCommit={(v) => setSetting(SettingField.SoftStopRange, v)}
            infoPanelProps={{
              description: "The buffer zone where force ramps up as you reach the maximum rotation limit.",
              impact: "Larger = soft cushion; smaller = hard wall feeling.",
            }}
          />
          <Slider
            isPro
            label="Soft Stop Strength (%)"
            value={effects.softStopStrength}
            onValueCommit={(v) => setSetting(SettingField.SoftStopStrength, v)}
            infoPanelProps={{
              description: "How hard the wheel pushes back when you reach the rotation limit.",
              impact: "Ensures you don't turn past the Motion Range during intense driving.",
              animationType: "bounce",
            }}
          />
          <Slider
            isPro
            label="Soft Stop Dampening (%)"
            value={effects.softStopDampeningStrength}
            onValueCommit={(v) => setSetting(SettingField.SoftStopDampeningStrength, v)}
            infoPanelProps={{
              description: "Extra resistance applied only when hitting the rotation limit.",
              impact: "Prevents the wheel from bouncing violently off the virtual stops.",
            }}
          />
        </div>
      </div>

      {/* DIRECTX SETTINGS PANEL */}
      <div className="effects_card">
        <div className="card_header">
          <i className="icon fi fi-sr-gamepad" />
          <h2>DirectX Settings</h2>
        </div>
        <div className="card_body">
          <ToggleSwitch
            label="Invert Constant Force"
            checked={effects.directXConstantDirection === 1}
            onToggle={(checked) =>
              setSetting(SettingField.DirectXConstantDirection, checked ? 1 : -1)
            }
          />
          <Slider
            isPro
            label="DirectX Spring Force Strength (%)"
            value={effects.directXSpringStrength}
            onValueCommit={(v) => setSetting(SettingField.DirectXSpringStrength, v)}
            infoPanelProps={{
              description: "Scales Spring effects sent by the game engine (distinct from Integrated Spring).",
              impact: "Usually controls centering forces in game menus or when resetting the car.",
              animationType: "spring",
            }}
          />
          <Slider
            isPro
            label="DirectX Constant Force Strength (%)"
            value={effects.directXConstantStrength}
            onValueCommit={(v) => setSetting(SettingField.DirectXConstantStrength, v)}
            infoPanelProps={{
              description: "Scales Constant Force effects, used for sustained G-forces in long corners.",
              impact: "Adjusts the 'weight' of the car during turns without losing road texture.",
              animationType: "constant",
            }}
          />
          <Slider
            isPro
            label="DirectX Periodic Force Strength (%)"
            value={effects.directXPeriodicStrength}
            onValueCommit={(v) => setSetting(SettingField.DirectXPeriodicStrength, v)}
            infoPanelProps={{
              description: "Scales repetitive vibration effects like engine rumble, road strips, and collisions.",
              impact: "Enhances the tactile 'buzz' and immersion of the road surface.",
              animationType: "vibrate",
              value: 10,
            }}
          />
        </div>
      </div>

    </div>
  );
};
