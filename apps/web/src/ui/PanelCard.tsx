import type { ReactNode } from "react";

export function PanelCard({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="panel-card">
      {(title || actions) && (
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
          {title ? <h2 style={{ margin: 0 }}>{title}</h2> : <span />}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
