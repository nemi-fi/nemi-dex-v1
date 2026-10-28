import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  hasSearchBar?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  hasSearchBar = false,
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col px-4 animate-in fade-in-0">
      <div
        className={`text-center space-y-4 ${hasSearchBar ? "mt-12" : "mt-16"}`}
      >
        <div className="mx-auto w-14 h-14 bg-muted rounded-full flex items-center justify-center">
          <Icon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </div>

        <div className="space-y-3 max-w-xs mx-auto">
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {children && <div className="pt-2">{children}</div>}
        </div>
      </div>
    </div>
  );
}
