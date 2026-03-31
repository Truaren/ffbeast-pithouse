import "./style.scss";

import { Button, InfoPanel, type InfoPanelProps } from "@components/ui";
import { useEffect, useRef, useState } from "react";

import { useAppPreferencesStore, useWheelStore } from "@/stores";

export interface SliderProps {
  isPro?: boolean;
  label?: string;
  hideLabel?: boolean;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  infoPanelProps?: InfoPanelProps;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
  onValueCommit?: (value: number) => void;
}

export const Slider = ({
  isPro = false,
  label,
  hideLabel = false,
  value,
  min = 0,
  max = 100,
  step = 1,
  infoPanelProps,
  disabled = false,
  onValueChange,
  onValueCommit,
}: SliderProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [prevPropValue, setPrevPropValue] = useState(value);
  const [showInfo, setShowInfo] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const infoWrapRef = useRef<HTMLSpanElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);

  const clamp = (val: number) => Math.min(max, Math.max(min, val));

  if (value !== prevPropValue) {
    setPrevPropValue(value);
    setLocalValue(clamp(value));
  }

  const snapToStep = (val: number) => {
    return clamp(Math.round((val - min) / step) * step + min);
  };

  const handleLiveUpdate = (newValue: number) => {
    if (isDisabled) return;
    const clamped = clamp(newValue);
    setLocalValue(clamped);
    onValueChange?.(clamped);
  };

  const commitValue = (newValue: number) => {
    if (isDisabled) return;
    const final = snapToStep(newValue);
    setLocalValue(final);
    if (final !== value) onValueCommit?.(final);
  };

  const isRegistered = useWheelStore(
    (state) => state.deviceState?.isRegistered,
  );

  const isAppPro = useAppPreferencesStore((state) => state.preferences.isPro);

  const isUnlocked = !!isRegistered || !!isAppPro;

  const isDisabled = disabled || (isPro && !isUnlocked);

  const POPUP_HEIGHT = 320; // estimated max height of the info panel

  const handleInfoClick = () => {
    const el = infoWrapRef.current;
    if (!showInfo && el) {
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;

      const style: React.CSSProperties = {};

      // Vertical: prefer below, flip to above if not enough space
      if (spaceBelow >= POPUP_HEIGHT) {
        style.top = "2.5rem";
        style.bottom = "auto";
      } else {
        style.bottom = "2.5rem";
        style.top = "auto";
      }

      setPopupStyle(style);
    }
    setShowInfo((prev) => !prev);
  };

  // Close popup when clicking anywhere outside the info button+panel
  useEffect(() => {
    if (!showInfo) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inButton = infoWrapRef.current?.contains(target);
      const inPanel = infoPanelRef.current?.contains(target);
      if (!inButton && !inPanel) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showInfo]);

  return (
    <div className={`setting_option ${isDisabled ? "disabled" : ""}`}>
      {!hideLabel && (
        <div className="option_title">
          <span>
            {label} {isPro && <i className="badge pro">PRO</i>}
          </span>

          <div className="value_controls">
            <Button
              variant="secondary"
              disabled={isDisabled || value <= min}
              onClick={() => commitValue(value - step)}
            >
              −
            </Button>
            <input
              type="number"
              className="value_input"
              value={localValue}
              min={min}
              max={max}
              step={step}
              disabled={isDisabled}
              onChange={(e) => handleLiveUpdate(Number(e.target.value))}
              onBlur={() => commitValue(localValue)}
              onKeyDown={(e) => e.key === "Enter" && commitValue(localValue)}
            />

            <Button
              variant="secondary"
              disabled={isDisabled || value >= max}
              onClick={() => commitValue(value + step)}
            >
              +
            </Button>

            {infoPanelProps && (
              <span ref={infoWrapRef} style={{ display: "inline-flex" }}>
                <Button
                  variant="secondary"
                  icon="icon fi fi-rr-info"
                  onClick={() => handleInfoClick()}
                />
              </span>
            )}
          </div>
        </div>
      )}

      <div className="slider_track_container">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          disabled={isDisabled}
          onChange={(e) => handleLiveUpdate(Number(e.target.value))}
          onMouseUp={() => commitValue(localValue)}
          onTouchEnd={() => commitValue(localValue)}
          style={
            {
              "--slider-fill": `${((localValue - min) / (max - min)) * 100}%`,
            } as React.CSSProperties
          }
        />
        <div className="ranges_text">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {showInfo && infoPanelProps && (
        <div
          className="info_popup_wrapper"
          ref={infoPanelRef}
          style={popupStyle}
        >
          <InfoPanel {...infoPanelProps} />
        </div>
      )}
    </div>
  );
};
