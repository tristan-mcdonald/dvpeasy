interface HeadingAndTotalProps {
  heading: string;
  count: number;
  singularName: string;
  pluralName?: string;
}

/**
 * A section's heading, with a count of its items beside it.
 */
export default function HeadingAndTotal ({ heading, count, singularName, pluralName }: HeadingAndTotalProps) {
  const pluralizedName = count === 1 ? singularName : (pluralName || `${singularName}s`);

  return (
    <div className="flex justify-between items-center">
      <h2>{heading}</h2>
      <span className="text-text-label">{count} {pluralizedName}</span>
    </div>
  );
}
