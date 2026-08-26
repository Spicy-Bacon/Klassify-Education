import './styles.css';
import { useEffect, useState } from 'react';
import { AdminPortal } from './admin/AdminPortal';
import { AuthNotConfigured } from './app/AuthNotConfigured';
import { createUnconfiguredIdentityApplication, isConfiguredIdentityApplication } from './identity/applicationIdentity';
import type { IdentityApplication } from './identity/identityTypes';

const pillars = ['Connect', 'Manage', 'Capture'];

export function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApplication />;
  }

  return (
    <main className="app-shell">
      <section className="intro" aria-labelledby="app-title">
        <p className="status">Development Build</p>
        <h1 id="app-title">AI School Platform</h1>
        <div className="pillars" aria-label="Product pillars">
          {pillars.map((pillar) => (
            <span key={pillar}>{pillar}</span>
          ))}
        </div>
        <a className="admin-link" href="/admin">Open Admin Portal</a>
      </section>
    </main>
  );
}

function AdminApplication() {
  const [identityApplication, setIdentityApplication] = useState<IdentityApplication>(() => createUnconfiguredIdentityApplication());

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    void import('./identity/developmentIdentityComposition').then((module) => {
      setIdentityApplication(module.createDevelopmentIdentityApplication());
    });
  }, []);

  if (!isConfiguredIdentityApplication(identityApplication)) {
    return <AuthNotConfigured />;
  }

  return (
    <AdminPortal
      allowIdentitySwitching={identityApplication.allowIdentitySwitching}
      identityOptions={identityApplication.identityOptions}
      identityService={identityApplication.identityService}
      initialUserId={identityApplication.initialUserId}
    />
  );
}
