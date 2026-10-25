import { useSearchParams } from "react-router-dom";
import { maintenanceConfig } from "@/constants/maintenance";
import { MaintenancePanel } from "@/components/public/MaintenancePanel";

const groups = [
  ...new Set(Object.values(maintenanceConfig).map((config) => config.group)),
];

export function MaintenancePage() {
  const [params, setParams] = useSearchParams();
  const tab = Object.hasOwn(maintenanceConfig, params.get("tab"))
    ? params.get("tab")
    : "municipality";
  const selectTab = (key) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("tab", key);
      return next;
    });

  return (
    <MaintenancePanel
      key={tab}
      config={maintenanceConfig[tab]}
      aside={
        <aside
          aria-label="Maintenance entities"
          className="min-w-0 overflow-x-auto rounded-lg border border-border bg-surface xl:self-start"
        >
          <div className="hidden border-b border-border px-4 py-4 xl:block">
            <div className="label-eyebrow">Reference data</div>
          </div>
          <nav className="flex min-w-max gap-1 p-2 xl:min-w-0 xl:flex-col xl:gap-5 xl:p-3">
            {groups.map((group) => (
              <div key={group} className="flex gap-0.5 xl:flex-col">
                <div className="label-eyebrow hidden px-3 pb-2 !text-[10px] xl:block">
                  {group}
                </div>
                {Object.entries(maintenanceConfig)
                  .filter(([, config]) => config.group === group)
                  .map(([key, config]) => {
                    const Icon = config.icon;
                    const selected = tab === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-current={selected ? "page" : undefined}
                        aria-controls="maintenance-table-panel"
                        onClick={() => selectTab(key)}
                        className={`relative flex shrink-0 items-center gap-3 whitespace-nowrap px-3 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? "bg-accent-soft font-semibold text-foreground"
                            : "text-secondary hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {selected && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-[3px] bg-accent"
                          />
                        )}
                        <Icon
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 ${selected ? "text-accent" : ""}`}
                          strokeWidth={selected ? 2.5 : 2}
                        />
                        {config.label}
                      </button>
                    );
                  })}
              </div>
            ))}
          </nav>
        </aside>
      }
    />
  );
}
