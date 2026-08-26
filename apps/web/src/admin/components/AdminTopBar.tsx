import type { EntityId, User } from '@ai-school-platform/contracts';
import { DevelopmentIdentitySwitcher } from './DevelopmentIdentitySwitcher';
import type { IdentityOption } from '../../identity/identityTypes';

export function AdminTopBar({
  allowIdentitySwitching,
  currentUser,
  identityOptions,
  onIdentityChange,
  selectedUserId,
}: {
  allowIdentitySwitching: boolean;
  currentUser?: User;
  identityOptions: IdentityOption[];
  onIdentityChange: (userId: EntityId) => void;
  selectedUserId: EntityId;
}) {
  return (
    <header className="admin-topbar">
      <div>
        <p className="status">Development Build</p>
        <h1>Klassify Education</h1>
      </div>
      <DevelopmentIdentitySwitcher
        allowIdentitySwitching={allowIdentitySwitching}
        currentUser={currentUser}
        identityOptions={identityOptions}
        selectedUserId={selectedUserId}
        onChange={onIdentityChange}
      />
    </header>
  );
}
