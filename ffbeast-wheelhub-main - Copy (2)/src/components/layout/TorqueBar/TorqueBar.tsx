import "./style.scss";

interface TorqueBarProps {
  torque: number; // Expected to be in range [-100, 100]
}

export const TorqueBar = ({ torque }: TorqueBarProps) => {
  const positive = torque > 0 ? torque : 0;
  const negative = torque < 0 ? Math.abs(torque) : 0;

  return (
    <div className="torque_bar">
      <div className="bar">
        <div className="positive">
          <div className="progress" style={{ height: `${positive}%` }}></div>
        </div>
        <div className="negative">
          <div className="progress" style={{ height: `${negative}%` }}></div>
        </div>
      </div>

      <span>Wheel Torque</span>
    </div>
  );
};
