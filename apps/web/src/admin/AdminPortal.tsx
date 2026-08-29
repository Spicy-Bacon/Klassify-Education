import { BrowserRouter } from 'react-router-dom';
import type { EntityId } from '@klassify/contracts';
import { AdminApp } from './AdminApp';
import type { AnnouncementService } from '../announcements/AnnouncementService';
import type { FormService } from '../forms/FormService';
import type { IdentityService } from '../identity/identityService';
import type { IdentityOption } from '../identity/identityTypes';

export function AdminPortal({
  allowIdentitySwitching,
  identityOptions,
  identityService,
  announcementService,
  formService,
  initialUserId,
}: {
  allowIdentitySwitching: boolean;
  announcementService: AnnouncementService;
  formService: FormService;
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
        announcementService={announcementService}
        formService={formService}
        initialUserId={initialUserId}
      />
    </BrowserRouter>
  );
}
