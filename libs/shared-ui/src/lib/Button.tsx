/**
 * Button component props interface
 */
export interface ButtonProps {
  /**
   * Button text content
   */
  children: React.ReactNode;
  /**
   * Click handler function
   */
  onClick?: () => void;
  /**
   * Button variant style
   */
  variant?: 'primary' | 'secondary';
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Button type attribute
   */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Simple Button component
 * @param props - Button component props
 * @returns Button element
 */
export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    border: '1px solid',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  };

  const variantStyles: Record<'primary' | 'secondary', React.CSSProperties> = {
    primary: {
      backgroundColor: disabled ? '#ccc' : '#0066cc',
      color: '#fff',
      borderColor: disabled ? '#ccc' : '#0066cc',
    },
    secondary: {
      backgroundColor: disabled ? '#f0f0f0' : '#fff',
      color: disabled ? '#999' : '#0066cc',
      borderColor: disabled ? '#ccc' : '#0066cc',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyles, ...variantStyles[variant] }}
    >
      {children}
    </button>
  );
}

export default Button;
