import { formatValue } from '../pages/pageUtils';

export function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-badge-${value}`}>{formatValue(value)}</span>;
}
