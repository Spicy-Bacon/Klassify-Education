import type { AuthenticatedUserContext, DomainResult } from '@ai-school-platform/contracts';
import type { IdentityService } from '../../identity/identityService';

export interface PageProps {
  service: IdentityService;
  userContext: AuthenticatedUserContext;
}

export interface ActionPageProps extends PageProps {
  onAction: <T>(result: DomainResult<T>, successMessage: string) => void;
}
