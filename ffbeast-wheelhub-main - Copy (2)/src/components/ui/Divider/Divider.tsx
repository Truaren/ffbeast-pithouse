import "./style.scss";

interface DividerProps {
  label?: string;
  disableLine?: boolean;
  style?: React.CSSProperties;
}

export const Divider = ({ label, disableLine, style }: DividerProps) => {
  return (
    <div className="divider" style={style}>
      {label && <div className="section_title">{label}</div>}
      {!disableLine && <div className="line" />}
    </div>
  );
};
