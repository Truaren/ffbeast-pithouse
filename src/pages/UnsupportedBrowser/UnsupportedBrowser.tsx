import "./style.scss";

import sad_face from "@/assets/sad_face.png";

export const UnsupportedBrowser = () => (
  <div className="unsupported_message">
    <img src={sad_face} alt="" />
    <h2>WebHID Not Supported</h2>
    <p>
      Your browser does not support the WebHID API. Please use Chrome or Edge.
    </p>
  </div>
);
