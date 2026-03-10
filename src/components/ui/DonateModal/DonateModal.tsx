import "./style.scss";

import { HeartHandshake, X } from "lucide-react";

import { Button } from "@/components/ui";

interface DonateModalProps {
  onClose: () => void;
}

export const DonateModal = ({ onClose }: DonateModalProps) => {
  return (
    <div className="donate_modal_overlay" onClick={onClose}>
      <div
        className="donate_modal_content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close_btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="donate_header">
          <HeartHandshake size={48} className="donate_icon" />
          <h2>Support FFBeast Pit House</h2>
        </div>

        <div className="donate_body">
          <p>
            This application is built with love and will{" "}
            <strong>always be 100% free</strong>. There are no hidden fees, and
            I do not plan to release any paid &quot;PRO&quot; features.
          </p>
          <p>
            However, if you&apos;d like to support the ongoing development, or
            if you have a specific feature request, you can send a donation!
          </p>
          <div className="donate_instructions">
            <strong>How to request a feature:</strong>
            <ol>
              <li>Click the button below to donate via Monobank.</li>
              <li>Open a ticket in the official bug tracker.</li>
              <li>
                Include your donation amount and a description of the feature
                you&apos;d like to see.
              </li>
              <li>
                I will personally contact you to discuss its implementation!
              </li>
            </ol>
          </div>
        </div>

        <div className="donate_footer">
          <Button
            className="monobank_btn"
            onClick={() =>
              window.open("https://send.monobank.ua/jar/6zmK5v4wwL", "_blank")
            }
          >
            Support via Monobank ❤️
          </Button>
        </div>
      </div>
    </div>
  );
};
