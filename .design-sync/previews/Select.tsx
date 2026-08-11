import { Select } from '@job-finder/ui';

const STATUSES = ['draft', 'applied', 'interviewing', 'offered', 'rejected', 'accepted'];

export function Default() {
  return (
    <div className="max-w-xs">
      <Select defaultValue="applied">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function Invalid() {
  return (
    <div className="max-w-xs">
      <Select invalid defaultValue="">
        <option value="" disabled>
          Select a status…
        </option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </Select>
    </div>
  );
}
