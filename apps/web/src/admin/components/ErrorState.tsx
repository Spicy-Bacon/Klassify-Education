export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-box state-box-error" role="alert">
      <strong>Something went wrong</strong>
      <p>{message}</p>
    </div>
  );
}
