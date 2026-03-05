import "./style.scss";

export interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle?: (checked: boolean) => void;
}

export const ToggleSwitch = ({
  label,
  checked,
  disabled = false,
  onToggle,
}: ToggleSwitchProps) => {
  const handleChange = () => {
    if (disabled) return;
    onToggle?.(!checked);
  };

  return (
    <div className="toggle-wrapper">
      <button
        type="button"
        role="switch"
        className={`toggle ${checked ? "checked" : ""} ${
          disabled ? "disabled" : ""
        }`}
        onClick={handleChange}
      >
        <span className="slider" />
      </button>
      {label && <span className="label">{label}</span>}
    </div>
  );
};
