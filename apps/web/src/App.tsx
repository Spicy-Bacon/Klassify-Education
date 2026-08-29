import './styles.css';
import { useEffect, useState, type ComponentType } from 'react';
import { AdminPortal } from './admin/AdminPortal';
import { AuthNotConfigured } from './app/AuthNotConfigured';
import { createUnconfiguredIdentityApplication, isConfiguredIdentityApplication } from './identity/applicationIdentity';
import type { ConfiguredIdentityApplication, IdentityApplication } from './identity/identityTypes';

const pillars = ['Connect', 'Manage', 'Capture'];

type DevelopmentInboxComponent = ComponentType<{ application: ConfiguredIdentityApplication }>;

export function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApplication />;
  }

  if (window.location.pathname.startsWith('/dev/inbox')) {
    return <DevelopmentInboxApplication />;
  }

  return (
    <main className="app-shell">
      <section className="intro" aria-labelledby="app-title">
        <p className="status">Development Build</p>
        <h1 id="app-title">Klassify Education</h1>
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
      announcementService={identityApplication.announcementService}
      formService={identityApplication.formService}
      initialUserId={identityApplication.initialUserId}
    />
  );
}

function DevelopmentInboxApplication() {
  const [identityApplication, setIdentityApplication] = useState<IdentityApplication>(() => createUnconfiguredIdentityApplication());
  const [InboxComponent, setInboxComponent] = useState<DevelopmentInboxComponent | undefined>();

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    void Promise.all([
      import('./identity/developmentIdentityComposition'),
      import('./dev/DevelopmentInbox'),
    ]).then(([identityModule, inboxModule]) => {
      setIdentityApplication(identityModule.createDevelopmentIdentityApplication());
      setInboxComponent(() => inboxModule.DevelopmentInbox);
    });
  }, []);

  if (!import.meta.env.DEV) {
    return <AuthNotConfigured />;
  }

  if (!isConfiguredIdentityApplication(identityApplication) || !InboxComponent) {
    return <AuthNotConfigured />;
  }

  return <InboxComponent application={identityApplication} />;
}
