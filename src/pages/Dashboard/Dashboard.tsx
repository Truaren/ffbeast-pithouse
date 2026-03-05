import { useEffect, useRef, useState } from "react";

import { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button, Slider, ToggleSwitch } from "@/components/ui";
import { useGamepads } from "@/hooks/use-gamepads";
import { useSettingUI } from "@/hooks/use-setting-ui";
import { useAppPreferencesStore, useDeviceSettingsStore, useWheelStore } from "@/stores";

import "./style.scss";

export const Dashboard = () => {
  const { api, positionDegrees, deviceId } = useWheelStore(
    useShallow((state) => ({
      api: state.api,
      positionDegrees: state.deviceState?.positionDegrees ?? 0,
      deviceId: state.deviceId,
    })),
  );

  const { 
    wheelName, wheelImageUrl, baseName, baseImageUrl, 
    pedalName: rawPedalName, pedalImageUrl, hiddenPedals: rawHiddenPedals, pedalBindings: rawPedalBindings, 
    setWheelImage, setWheelName, setBaseImage, setBaseName, 
    setPedalName, setPedalImage, togglePedalVisibility, setPedalBinding 
  } = useAppPreferencesStore(
    useShallow((state) => ({
      wheelName: state.preferences.wheelName,
      wheelImageUrl: state.preferences.wheelImageUrl,
      baseName: state.preferences.baseName,
      baseImageUrl: state.preferences.baseImageUrl,
      pedalName: state.preferences.pedalName,
      pedalImageUrl: state.preferences.pedalImageUrl,
      hiddenPedals: state.preferences.hiddenPedals,
      pedalBindings: state.preferences.pedalBindings,
      setWheelImage: state.setWheelImage,
      setWheelName: state.setWheelName,
      setBaseImage: state.setBaseImage,
      setBaseName: state.setBaseName,
      setPedalName: state.setPedalName,
      setPedalImage: state.setPedalImage,
      togglePedalVisibility: state.togglePedalVisibility,
      setPedalBinding: state.setPedalBinding,
    })),
  );

  const pedalName = rawPedalName || "Feel VR Pedals";
  const hiddenPedals = rawHiddenPedals || [];
  const pedalBindings = rawPedalBindings || { Throttle: 0, Brake: 1, Clutch: 2 };

  const safeWheelName = wheelName?.trim() || "Steering Wheel";
  const safeBaseName = baseName?.trim() || "R12 Base";
  const safePedalName = pedalName?.trim() || "Feel VR Pedals";

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempWheelName, setTempWheelName] = useState("");

  const [isEditingBaseName, setIsEditingBaseName] = useState(false);
  const [tempBaseName, setTempBaseName] = useState("");

  const [isEditingPedalName, setIsEditingPedalName] = useState(false);
  const [tempPedalName, setTempPedalName] = useState("");

  const [bindingPedal, setBindingPedal] = useState<"Throttle" | "Brake" | "Clutch" | null>(null);
  // Store baseline for ALL gamepads during bind: { deviceId: number[] }
  const baselineAxesRef = useRef<Record<string, readonly number[]>>({});

  const [tempMaxAngle, setTempMaxAngle] = useState<string>("");

  const { effects, hardware } = useDeviceSettingsStore(
    useShallow((state) => ({
      effects: state.settings.effects,
      hardware: state.settings.hardware,
    })),
  );

  const setSetting = useSettingUI();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWheelImage(file)
      .then(() => toast.success("Wheel image updated."))
      .catch((error) =>
        toast.error("Failed to update wheel image: " + (error as Error).message),
      );
  };

  const handleBaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBaseImage(file)
      .then(() => toast.success("Base image updated."))
      .catch((error) =>
        toast.error("Failed to update base image: " + (error as Error).message),
      );
  };

  const handlePedalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPedalImage(file)
      .then(() => toast.success("Pedal image updated."))
      .catch((error) =>
        toast.error("Failed to update pedal image: " + (error as Error).message),
      );
  };

  const handleCenter = () => {
    api.resetWheelCenter().catch(console.error);
    toast.info("Wheel centered successfully.");
  };

  const startEditingName = () => {
    setTempWheelName(safeWheelName);
    setIsEditingName(true);
  };

  const saveWheelName = () => {
    if (tempWheelName.trim() !== "") {
      setWheelName(tempWheelName.trim());
    }
    setIsEditingName(false);
  };

  const startEditingBaseName = () => {
    setTempBaseName(safeBaseName);
    setIsEditingBaseName(true);
  };

  const saveBaseName = () => {
    if (tempBaseName.trim() !== "") {
      setBaseName(tempBaseName.trim());
    }
    setIsEditingBaseName(false);
  };

  const startEditingPedalName = () => {
    setTempPedalName(safePedalName);
    setIsEditingPedalName(true);
  };

  const savePedalName = () => {
    if (tempPedalName.trim() !== "") {
      setPedalName(tempPedalName.trim());
    }
    setIsEditingPedalName(false);
  };

  const gamepads = useGamepads();
  const allPads = Object.values(gamepads);

  useEffect(() => {
    console.log("Connected Gamepads:", allPads.map(p => p.id));
  }, [allPads]);

  // Global binding effect
  useEffect(() => {
    if (!bindingPedal || allPads.length === 0) return;

    // Check if we need to take a baseline snapshot
    if (Object.keys(baselineAxesRef.current).length === 0) {
      for (const gp of allPads) {
        baselineAxesRef.current[gp.id] = [...gp.axes];
      }
      return;
    }

    // Compare current axes to baselines for all gamepads
    for (const gp of allPads) {
       const baseline = baselineAxesRef.current[gp.id];
       if (!baseline) continue; // New device just plugged in, ignore for this bind frame

       for (let i = 0; i < gp.axes.length; i++) {
          const baselineValue = baseline[i];
          const currentValue = gp.axes[i];
          
          if (Math.abs(currentValue - baselineValue) > 0.15) {
             console.log(`[Bind] Detected large movement on ${gp.id} axis ${i}. Baseline: ${baselineValue}, Current: ${currentValue}`);
             
             try {
               // WE MUST CLEAR STATE SYNCHRONOUSLY FIRST to avoid infinite loop on store re-render
               const boundPedal = bindingPedal;
               setBindingPedal(null);
               baselineAxesRef.current = {};

               // Update BOTH device ID and axis binding
               console.log("Setting binding...", gp.id, boundPedal, i);
               useAppPreferencesStore.getState().setPedalDeviceId(gp.id);
               setPedalBinding(boundPedal, i);
               console.log("Binding set.");
               toast.success(`${boundPedal} bound to Axis ${i}`);
             } catch (err) {
               console.error("CRASH DURING BINDING:", err);
             }

             return; // Break out of all loops
          }
       }
    }
  }, [allPads, bindingPedal, setPedalBinding]);

  const startBinding = (pedal: "Throttle" | "Brake" | "Clutch") => {
    if (allPads.length === 0) {
      toast.error("Connect the pedals first.");
      return;
    }
    console.log(`[Bind] Starting global binding for ${pedal}. Connected pads: ${allPads.length}`);
    baselineAxesRef.current = {}; // Clear baselines to trigger a fresh snapshot next frame
    setBindingPedal(pedal);
  };

  const cancelBinding = () => {
    setBindingPedal(null);
    baselineAxesRef.current = {};
  };

  // The active pad for UI is now determined by the user's saved device ID, 
  // or fallback to 'feel vr', or fallback to the first available.
  const pedalDeviceId = useAppPreferencesStore.getState().preferences.pedalDeviceId;
  const activePad = allPads.find(p => p.id === pedalDeviceId) ?? 
                    allPads.find(p => p.id.toLowerCase().includes("feel vr")) ?? 
                    allPads[0];

  const getAxisPct = (axisIndex: number | undefined) => {
    if (axisIndex === undefined || axisIndex === null) return 0;
    if (!activePad || activePad.axes.length <= axisIndex) return 0;
    const raw = activePad.axes[axisIndex]; // usually -1 to 1
    // Convert -1..1 to 0..100
    // Sometimes pedals rest at -1, fully pressed at 1. Sometimes resting at 0, fully pressed at 1 or -1.
    // For universal typical pedals: -1 is unpressed, 1 is fully pressed
    return Math.max(0, Math.min(100, ((raw + 1) / 2) * 100));
  };
  
  const throttleVal = getAxisPct(pedalBindings?.Throttle ?? 0);
  const brakeVal = getAxisPct(pedalBindings?.Brake ?? 1);
  const clutchVal = getAxisPct(pedalBindings?.Clutch ?? 2);

  return (
    <div className="moza_dashboard">
      {/* LEFT PANEL - STEERING WHEEL */}
      <div className="panel wheel_panel">
        <div className="panel_header">
          {isEditingName ? (
             <input
               className="wheel_name_input"
               value={tempWheelName}
               onChange={(e) => setTempWheelName(e.target.value)}
               onBlur={saveWheelName}
               onKeyDown={(e) => e.key === 'Enter' && saveWheelName()}
               autoFocus
             />
          ) : (
             <h2 onClick={startEditingName} className="wheel_name_display" title="Click to rename" style={{ minWidth: '100px', minHeight: '1.25rem' }}>
               {safeWheelName}
             </h2>
          )}
          <Button variant="secondary" className="more_btn">More</Button>
        </div>
        
        <div className="angle_display">
          <span className="angle_value">{Math.round(positionDegrees)}°</span>
        </div>

        <div className="wheel_image_container">
          <div className="wheel_img_wrapper">
            <img
              src={wheelImageUrl}
              alt="Steering Wheel"
              className="wheel_img"
              style={{ transform: `rotate(${positionDegrees}deg)` }}
            />
            <label className="upload_overlay">
              <i className="icon fi fi-rr-shuffle"></i>
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <div className="angle_controls">
          <div className="angle_slider_header">
            <span className="angle_label">Maximum Steering Angle</span>
            <Button variant="primary" className="center_btn" onClick={handleCenter}>Center</Button>
            <i className="icon fi fi-rr-info tooltip_icon"></i>
          </div>
          
          <div className="angle_slider_row">
            <span className="angle_min">90</span>
            <div className="slider_wrapper">
               <Slider
                 value={effects.motionRange}
                 min={90}
                 max={2700}
                 hideLabel
                 onValueChange={(v) => setTempMaxAngle(v.toString())}
                 onValueCommit={(v) => { void setSetting(SettingField.MotionRange, v); setTempMaxAngle(""); }}
               />
            </div>
            <span className="angle_max">2700</span>
            <input 
              type="number" 
              className="angle_input_box"
              value={tempMaxAngle || effects.motionRange}
              onChange={(e) => setTempMaxAngle(e.target.value)}
              onBlur={() => {
                 let val = parseInt(tempMaxAngle);
                 if (!isNaN(val)) {
                    val = Math.max(90, Math.min(2700, val));
                    void setSetting(SettingField.MotionRange, val);
                 }
                 setTempMaxAngle("");
              }}
              onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                    let val = parseInt(tempMaxAngle);
                    if (!isNaN(val)) {
                       val = Math.max(90, Math.min(2700, val));
                       void setSetting(SettingField.MotionRange, val);
                    }
                    setTempMaxAngle("");
                 }
              }}
            />
          </div>

          <div className="angle_presets">
             {[360, 540, 720, 900].map(angle => (
               <button 
                key={angle} 
                className={`preset_btn ${effects.motionRange === angle ? 'active' : ''}`}
                onClick={() => { void setSetting(SettingField.MotionRange, angle); }}
               >
                 {angle}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="right_column">
        
        {/* TOP RIGHT PANEL - BASE */}
        <div className="panel base_panel">
          <div className="panel_header">
            {isEditingBaseName ? (
               <input
                 className="base_name_input"
                 value={tempBaseName}
                 onChange={(e) => setTempBaseName(e.target.value)}
                 onBlur={saveBaseName}
                 onKeyDown={(e) => e.key === 'Enter' && saveBaseName()}
                 autoFocus
               />
            ) : (
               <h2 onClick={startEditingBaseName} className="base_name_display" title="Click to rename" style={{ minWidth: '100px', minHeight: '1.25rem' }}>
               {safeBaseName}
             </h2>
            )}
            <Button variant="secondary" className="more_btn">More</Button>
          </div>

          <div className="base_content">
             <div className="base_image_placeholder">
                {baseImageUrl ? (
                   <img src={baseImageUrl} alt="Base" className="base_img" />
                ) : (
                   <i className="icon fi fi-rr-computer" style={{fontSize: '4rem', color: '#555'}}></i>
                )}
                <label className="upload_overlay">
                  <i className="icon fi fi-rr-shuffle"></i>
                  <input type="file" accept="image/*" onChange={handleBaseImageChange} />
                </label>
             </div>
             
             <div className={`base_controls ${hardware.forceEnabled === 0 ? 'disabled_look' : ''}`}>
                <span className="control_label">Game Force Feedback Intensity</span>
                <div className="slider_with_value">
                  <div style={{ flex: 1 }}>
                    <Slider
                      value={effects.totalEffectStrength}
                      min={0}
                      max={100}
                      hideLabel
                      onValueChange={(v) => setSetting(SettingField.TotalEffectStrength, v)}
                      onValueCommit={(v) => { void setSetting(SettingField.TotalEffectStrength, v); }}
                    />
                  </div>
                  <span className="slider_percent">{effects.totalEffectStrength} %</span>
                </div>

                <div className="work_mode_toggle">
                   <ToggleSwitch
                      label="Work Mode"
                      checked={hardware.forceEnabled === 1}
                      onToggle={async (checked) => { await setSetting(SettingField.ForceEnabled, checked ? 1 : 0); }}
                   />
                </div>
             </div>
          </div>
          <div className="base_footer">
             <span>Device ID: {deviceId ?? "Disconnected"}</span>
          </div>
        </div>

        {/* BOTTOM RIGHT PANEL - PEDALS */}
        <div className="panel pedals_panel">
          <div className="panel_header">
            {isEditingPedalName ? (
               <input
                 className="pedal_name_input"
                 value={tempPedalName}
                 onChange={(e) => setTempPedalName(e.target.value)}
                 onBlur={savePedalName}
                 onKeyDown={(e) => e.key === 'Enter' && savePedalName()}
                 autoFocus
               />
            ) : (
               <h2 onClick={startEditingPedalName} className="pedal_name_display" title="Click to rename" style={{ minWidth: '100px', minHeight: '1.1rem' }}>
               {safePedalName}
             </h2>
            )}
             <Button variant="secondary" className="more_btn">More</Button>
          </div>

          <div className="pedals_content">
             <div className="pedals_image_placeholder">
                {pedalImageUrl ? (
                   <img src={pedalImageUrl} alt="Pedals" className="pedal_img" />
                ) : (
                   <i className="icon fi fi-sr-box-open" style={{fontSize: '4rem', color: '#555'}}></i>
                )}
                <label className="upload_overlay">
                  <i className="icon fi fi-rr-shuffle"></i>
                  <input type="file" accept="image/*" onChange={handlePedalImageChange} />
                </label>
                {activePad ? (
                   <span className="status" style={{color: '#10b981'}}><i className="icon fi fi-sr-bullet"></i> Connected</span>
                ) : (
                   <span className="status disconnected"><i className="icon fi fi-sr-bullet"></i> Disconnected</span>
                )}
             </div>

             <div className="pedals_sliders">
                {(['Throttle', 'Brake', 'Clutch'] as const).map((pedal) => {
                  let val = 0;
                  if (pedal === 'Throttle') val = throttleVal;
                  if (pedal === 'Brake') val = brakeVal;
                  if (pedal === 'Clutch') val = clutchVal;
                  
                  const isBindingThis = bindingPedal === pedal;
                  // Safe includes check in case hiddenPedals is somehow still undefined
                  const isHidden = Array.isArray(hiddenPedals) ? hiddenPedals.includes(pedal) : false;

                  return (
                    <div key={pedal} className={`pedal_row ${isHidden ? 'hidden_pedal' : ''}`}>
                       <div className="pedal_label_container">
                         <span className="pedal_label">
                           {pedal} {activePad && !isBindingThis && !isHidden && `(${Math.round(val)}%)`}
                         </span>
                         <button className="hide_pedal_btn" onClick={() => togglePedalVisibility(pedal)} title={isHidden ? "Show Pedal" : "Hide Pedal"}>
                            <i className={isHidden ? "icon fi fi-rr-eye-crossed" : "icon fi fi-rr-eye"}></i>
                         </button>
                       </div>
                       
                       {!isHidden && (
                         <div className="pedal_control">
                            {isBindingThis ? (
                              <div className="binding_message" onClick={cancelBinding} style={{cursor: 'pointer'}}>
                                 Press pedal or click to cancel...
                              </div>
                            ) : (
                              <>
                                <button className={`btn_bind ${!activePad ? 'disabled': ''}`} onClick={() => startBinding(pedal)}>Bind</button>
                                <div className={`progress_track ${!activePad ? 'disabled': ''}`} style={{ opacity: activePad ? 1 : 0.5 }}>
                                   <div className="progress_fill" style={{width: `${val}%`, transition: 'none'}}></div>
                                </div>
                                <button className={`limit_btn ${!activePad ? 'disabled': ''}`}>set max</button>
                              </>
                            )}
                         </div>
                       )}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
