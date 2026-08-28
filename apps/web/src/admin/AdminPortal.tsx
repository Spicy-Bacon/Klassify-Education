import { BrowserRouter } from 'react-router-dom';
import type { EntityId } from '@ai-school-platform/contracts';
import { AdminApp } from './AdminApp';
import type { AnnouncementService } from '../announcements/AnnouncementService';
import type { IdentityService } from '../identity/identityService';
import type { IdentityOption } from '../identity/identityTypes';

export function AdminPortal({
  allowIdentitySwitching,
  identityOptions,
  identityService,
  announcementService,
  initialUserId,
}: {
  allowIdentitySwitching: boolean;
  announcementService: AnnouncementService;
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
        initialUserId={initialUserId}
      />
    </BrowserRouter>
  );
}
