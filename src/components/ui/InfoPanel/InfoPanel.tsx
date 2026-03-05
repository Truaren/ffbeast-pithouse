import "./style.scss";

import { useAppPreferencesStore } from "@/stores";

type AnimationType =
  | "rotation"
  | "vibrate"
  | "pulse"
  | "spring"
  | "bounce"
  | "limit"
  | "dampen"
  | "slow"
  | "constant";

export interface InfoPanelProps {
  description: string;
  impact?: string;
  animationType?: AnimationType;
  value?: number;
  image?: string;
}

export const InfoPanel = ({
  description,
  impact,
  animationType,
  value,
  image,
}: InfoPanelProps) => {
  const globalWheelImage = useAppPreferencesStore(
    (state) => state.preferences.wheelImageUrl,
  );

  const finalImage = image ?? globalWheelImage;

  return (
    <div className="info_panel">
      {description && (
        <div className="info_section">
          <span className="info_label">Description</span>
          <p className="info_text">{description}</p>
        </div>
      )}
      {impact && (
        <div
          className="info_section"
          style={{
            border: "none",
          }}
        >
          <span className="info_label">Impact</span>
          <p className="info_text">{impact}</p>
        </div>
      )}

      {animationType && finalImage && (
        <div className="video">
          <img
            alt=""
            src={finalImage}
            className={`animation-${animationType}`}
            style={(() => {
              switch (animationType) {
                case "rotation":
                  return {
                    ["--wheel-degree" as string]: `${value}deg`,
                  };
                case "vibrate":
                  return {
                    ["--strength-value" as string]: `${value && value > 10 ? value / 2 : value}`,
                  };
                default:
                  return undefined;
              }
            })()}
          />
        </div>
      )}
    </div>
  );
};
