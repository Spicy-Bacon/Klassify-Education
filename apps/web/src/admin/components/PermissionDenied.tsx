export function PermissionDenied({
  message = 'Your account does not have permission to access this section.',
  title = 'Access restricted',
}: {
  message?: string;
  title?: string;
}) {
  return (
    <div className="state-box state-box-restricted" role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
