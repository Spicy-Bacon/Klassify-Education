import { BrowserRouter } from 'react-router-dom';
import type { EntityId } from '@ai-school-platform/contracts';
import { AdminApp } from './AdminApp';
import type { IdentityService } from '../identity/identityService';
import type { IdentityOption } from '../identity/identityTypes';

export function AdminPortal({
  allowIdentitySwitching,
  identityOptions,
  identityService,
  initialUserId,
}: {
  allowIdentitySwitching: boolean;
  identityOptions: IdentityOption[];
  identityService: IdentityService;
  initialUserId: EntityId;
}) {
  return (
    <BrowserRouter>
      <AdminApp
        allowIdentitySwitching={allowIdentitySwitching}
        identityOptions={identityOptions}
        identityService={identityService}
        initialUserId={initialUserId}
      />
    </BrowserRouter>
  );
}
