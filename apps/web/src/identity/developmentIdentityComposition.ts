import { AnnouncementService } from '../announcements/AnnouncementService';
import { DevelopmentAnnouncementRepository } from '../announcements/DevelopmentAnnouncementRepository';
import { DevelopmentIdentityRepository, developmentIdentityIds } from './developmentIdentityRepository';
import { IdentityService } from './identityService';
import type { ConfiguredIdentityApplication } from './identityTypes';

export function createDevelopmentIdentityApplication(): ConfiguredIdentityApplication {
  if (!import.meta.env.DEV) {
    throw new Error('Development identity composition cannot be used outside development builds.');
  }

  const repository = new DevelopmentIdentityRepository();
  const service = new IdentityService(repository);
  const announcementService = new AnnouncementService(new DevelopmentAnnouncementRepository(), service);
  const snapshot = repository.getSnapshot();
  const identityIds = [
    developmentIdentityIds.principal,
    developmentIdentityIds.admin,
    developmentIdentityIds.teacher3A,
    developmentIdentityIds.parentAmy,
    developmentIdentityIds.studentChloeUser,
  ];

  return {
    mode: 'development',
    identityService: service,
    announcementService,
    initialUserId: developmentIdentityIds.principal,
    identityOptions: identityIds.map((id) => {
      const user = snapshot.users.find((candidate) => candidate.id === id);
      return { id, label: user?.displayName ?? id };
    }),
    allowIdentitySwitching: true,
  };
}
