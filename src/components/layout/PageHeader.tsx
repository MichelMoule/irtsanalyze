interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 lg:px-8 py-5 bg-gray-100">
      <div>
        <h1 className="text-xl font-extrabold text-flat-fg leading-tight tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-flat-text-tertiary mt-0.5 font-medium">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
