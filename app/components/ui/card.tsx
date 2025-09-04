/**
 * A reusable card component for grouping and containing content.
 * It applies consistent padding, border, shadow, and background color.
 *
 * @param {React.ComponentProps<'div'>} props - The props for the card.
 * @returns {JSX.Element} The card component.
 */
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-testid='card'
      className={`bg-neutral-100 border border-neutral-200 rounded-lg shadow-sm p-6 ${
        className || ''
      }`}
      {...props}
    />
  );
}
