import type { EntityId, User } from '@klassify/contracts';
import type { IdentityOption } from '../../identity/identityTypes';

export function DevelopmentIdentitySwitcher({
  allowIdentitySwitching,
  currentUser,
  identityOptions,
  selectedUserId,
  onChange,
}: {
  allowIdentitySwitching: boolean;
  currentUser?: User;
  identityOptions: IdentityOption[];
  selectedUserId: EntityId;
  onChange: (userId: EntityId) => void;
}) {
  if (!allowIdentitySwitching) {
    return (
      <aside className="identity-box">
        <span>Signed in as</span>
        <strong>{currentUser?.displayName ?? 'Unknown user'}</strong>
      </aside>
    );
  }

  return (
    <aside className="identity-box identity-box-development">
      <span>DEVELOPMENT ONLY</span>
      <strong>Signed in as</strong>
      <div className="identity-options">
        {identityOptions.map((option) => (
          <button
            className={selectedUserId === option.id ? 'active' : undefined}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
