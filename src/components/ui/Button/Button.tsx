import "./style.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const Button = ({
  variant = "primary",
  icon,
  className = "",
  style,
  children,
  disabled = false,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`button_comp ${variant} ${className} ${disabled ? "disabled" : ""}`}
      style={style}
      disabled={disabled}
      {...props}
    >
      {icon && <i className={icon} />}
      {children}
    </button>
  );
};
