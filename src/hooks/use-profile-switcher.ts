import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

import { useProfileStore } from "@/stores";
import { confirmToast } from "@/utils/toast";

export const useProfileSwitcher = () => {
  const { isDirty, setActiveProfile } = useProfileStore(
    useShallow((state) => ({
      isDirty: state.isDirty,
      setActiveProfile: state.setActiveProfile,
    })),
  );

  const switchProfile = async (id: string) => {
    try {
      if (isDirty) {
        const confirmed = await confirmToast(
          "You have unsaved changes. Do you want to continue without saving?",
          undefined,
          "profile-change",
          "warning",
        );

        if (!confirmed) return;
      }

      setActiveProfile(id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return { switchProfile };
};
