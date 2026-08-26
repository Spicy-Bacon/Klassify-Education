export function LoadingState({ message = 'Loading records...' }: { message?: string }) {
  return (
    <div className="state-box" role="status">
      <strong>{message}</strong>
    </div>
  );
}
