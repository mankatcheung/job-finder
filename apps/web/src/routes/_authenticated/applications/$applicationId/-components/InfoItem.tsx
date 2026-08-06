export function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd
        className={highlight ? 'text-orange-500 font-medium' : 'text-gray-700 dark:text-gray-300'}
      >
        {value}
      </dd>
    </div>
  );
}
