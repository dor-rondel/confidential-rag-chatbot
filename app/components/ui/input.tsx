/**
 * A reusable input component, styled for the application theme.
 * It accepts all standard input props and applies base styling.
 *
 * @param {React.ComponentProps<'input'>} props - The props for the input.
 * @returns {JSX.Element} The input component.
 */
export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={`block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
        className || ''
      }`}
      {...props}
    />
  );
}
