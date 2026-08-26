import type { ReactNode } from 'react';

export function PageHeader({
  actions,
  children,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {children ? <p>{children}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
