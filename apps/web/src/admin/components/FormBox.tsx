import type { ReactNode } from 'react';

export function FormBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="form-box">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
