import { Loader2 } from "lucide-react";
import logoAsset from "@/assets/logo.png";

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] grid min-h-[100svh] place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img
          src={logoAsset}
          alt="AgriCentral"
          className="h-12 w-12 object-contain"
        />
        <div className="flex items-center gap-2 text-secondary">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase">
            Loading…
          </span>
        </div>
      </div>
    </div>
  );
}