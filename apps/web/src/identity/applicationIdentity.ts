import type { IdentityApplication } from './identityTypes';

export function createUnconfiguredIdentityApplication(): IdentityApplication {
  return {
    mode: 'production-unconfigured',
    identityOptions: [],
    allowIdentitySwitching: false,
  };
}

export function isConfiguredIdentityApplication(
  application: IdentityApplication,
): application is Extract<IdentityApplication, { mode: 'development' }> {
  return application.mode === 'development';
}
