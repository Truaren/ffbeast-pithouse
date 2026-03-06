import "./style.scss";

interface InputBoxProps {
  label?: string;
  type?: "text" | "password" | "email" | "number";
  value?: string;
  placeholder?: string;
  readonly?: boolean;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export const InputBox = ({
  label,
  type = "text",
  value,
  placeholder,
  readonly = false,
  disabled = false,
  onValueChange,
}: InputBoxProps) => {
  return (
    <div className={`input_box ${disabled ? "disabled" : ""}`}>
      <label htmlFor="input">{label}</label>
      <input
        id="input"
        type={type}
        value={value}
        readOnly={readonly}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onValueChange?.(e.target.value)}
      />
    </div>
  );
};
