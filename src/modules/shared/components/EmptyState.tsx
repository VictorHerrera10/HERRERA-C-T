import { Icon } from "./Icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-edge px-5 py-12 text-center">
      {icon && <Icon name={icon} className="mx-auto h-8 w-8 text-ash" />}
      <p className={`font-display text-base font-semibold text-snow ${icon ? "mt-3" : ""}`}>
        {title}
      </p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-fog">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
