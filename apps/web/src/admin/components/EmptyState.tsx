export function EmptyState({ message }: { message: string }) {
  return (
    <div className="state-box" role="status">
      <strong>No records</strong>
      <p>{message}</p>
    </div>
  );
}
