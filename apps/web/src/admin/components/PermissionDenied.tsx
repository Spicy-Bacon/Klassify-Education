export function PermissionDenied() {
  return (
    <div className="state-box state-box-restricted" role="alert">
      <strong>Access restricted</strong>
      <p>Your account does not have permission to access this section.</p>
    </div>
  );
}
