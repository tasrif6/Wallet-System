import { Toaster as Sonner } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

// shadcn/ui "Sonner" toast host (no next-themes dependency).
export function Toaster(props) {
  const { theme } = useTheme();
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      duration={5000}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{ classNames: { toast: "rounded-xl shadow-lg" } }}
      {...props}
    />
  );
}
