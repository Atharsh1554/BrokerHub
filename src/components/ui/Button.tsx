import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-sm hover:shadow-md',
    secondary: 'border-2 border-primary text-primary hover:bg-primary-50 focus:ring-primary',
    danger: 'bg-status-red text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'text-gray-text hover:bg-gray-100 focus:ring-gray-300',
    outline: 'border border-gray-border text-text-primary hover:bg-gray-50 focus:ring-gray-300',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
