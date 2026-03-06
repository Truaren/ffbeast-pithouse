import { useUpdateStore } from "@/stores/updateStore";
import { Button } from "@/components/ui/Button/Button";
import "./style.scss";

export const UpdateModal = () => {
  const { updateAvailable, setUpdateAvailable } = useUpdateStore();

  if (!updateAvailable) return null;

  return (
    <div className="update_modal_overlay">
      <div className="update_modal_content">
        <div className="update_modal_header">
          <h2>New Version Available: {updateAvailable.version}</h2>
          <Button 
            variant="secondary" 
            className="close_btn" 
            onClick={() => setUpdateAvailable(null)}
          >
            <i className="icon fi fi-rr-cross" />
          </Button>
        </div>
        
        <div className="update_modal_body">
          <p className="update_subtitle">
            A new version of FFBeast Pit House is ready to download!
          </p>
          <div className="update_changelog">
            <h3>Release Notes:</h3>
            <pre>{updateAvailable.notes || "No release notes provided."}</pre>
          </div>
        </div>

        <div className="update_modal_footer">
          <Button variant="secondary" onClick={() => setUpdateAvailable(null)}>
            Later
          </Button>
          <Button 
            onClick={() => {
              window.open(updateAvailable.url, "_blank");
              setUpdateAvailable(null);
            }}
          >
            Download Now
          </Button>
        </div>
      </div>
    </div>
  );
};
