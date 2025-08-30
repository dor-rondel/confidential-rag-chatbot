/**
 * A reusable label component, styled for the application theme.
 * It accepts all standard label props and applies base styling.
 *
 * @param {React.ComponentProps<'label'>} props - The props for the label.
 * @returns {JSX.Element} The label component.
 */
export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      className={`block text-sm font-medium text-neutral-700 ${
        className || ''
      }`}
      {...props}
    />
  );
}
