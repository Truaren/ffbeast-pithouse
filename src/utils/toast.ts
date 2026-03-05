import { toast } from "sonner";

type ToastType = "success" | "info" | "warning" | "error" | "loading";

export function confirmToast(
  message: string,
  description?: string,
  origin = "default",
  type: ToastType = "info",
): Promise<boolean> {
  const toastId = `$confirm:${origin}`;

  return new Promise((resolve) => {
    toast[type](message, {
      id: toastId,
      description,
      duration: Infinity,
      action: {
        label: "Continue",
        onClick: () => resolve(true),
      },
      cancel: {
        label: "Cancel",
        onClick: () => resolve(false),
      },
      onDismiss: () => resolve(false),
    });
  });
}
