interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-shine-border">
      <div>
        <h1 className="text-xl font-semibold text-shine-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-shine-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
