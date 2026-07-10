export function ItemList({ items, empty }) {
  if (!items || items.length === 0)
    return <div className="text-sm text-secondary">{empty}</div>;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li
          key={i}
          className="flex items-center justify-between border border-border bg-muted-40 px-3 py-2 text-sm font-medium text-foreground"
        >
          <span className="truncate">{i}</span>
        </li>
      ))}
    </ul>
  );
}
