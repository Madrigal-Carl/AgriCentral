export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="label-eyebrow mb-2">AgriCentral</div>
        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
