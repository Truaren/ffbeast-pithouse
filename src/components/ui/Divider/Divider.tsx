import "./style.scss";

interface DividerProps {
  label?: string;
  disableLine?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Divider = ({
  label,
  disableLine,
  style,
  className,
}: DividerProps) => {
  return (
    <div className={`divider ${className ?? ""}`} style={style}>
      {label && <div className="section_title">{label}</div>}
      {!disableLine && <div className="line" />}
    </div>
  );
};
