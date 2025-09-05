import type { ReactNode } from 'react';

/**
 * Props for the Message component.
 */
type MessageProps = {
  role: 'user' | 'assistant';
  children: ReactNode;
};

const roleStyles = {
  user: 'bg-primary-500 text-white self-end rounded-lg rounded-br-none',
  assistant:
    'bg-neutral-200 text-neutral-900 self-start rounded-lg rounded-bl-none',
};

/**
 * A component to display a single chat message.
 * It styles the message differently based on the role (user or assistant).
 *
 * @param {MessageProps} props - The props for the component.
 * 
 * @returns {JSX.Element} The message component.
 */
export function Message({ role, children }: MessageProps) {
  return (
    <div data-testid='message' className={`max-w-md p-3 ${roleStyles[role]}`}>
      {children}
    </div>
  );
}
