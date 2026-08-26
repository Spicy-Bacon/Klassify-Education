import type { ReactNode } from 'react';

export function DetailBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-box">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
