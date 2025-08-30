/**
 * A reusable button component, styled for the application theme.
 * It accepts all standard button props and applies base styling.
 *
 * @param {React.ComponentProps<'button'>} props - The props for the button.
 * @returns {JSX.Element} The button component.
 */
export function Button({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={`px-4 py-2 rounded-md font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
        className || ''
      }`}
      {...props}
    />
  );
}
