import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  type,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-primary dark:text-slate-200">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-label dark:text-slate-400">
            {icon}
          </span>
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={`w-full px-4 py-2.5 border border-gray-border dark:border-slate-700 rounded-lg text-sm text-text-primary dark:text-white placeholder-gray-label dark:placeholder-slate-500 bg-white dark:bg-slate-900 disabled:bg-gray-100 dark:bg-slate-700 disabled:dark:bg-slate-800 disabled:dark:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed
            focus:border-primary dark:focus:border-emerald-500 focus:ring-1 focus:ring-primary dark:focus:ring-emerald-500 transition-colors duration-200
            ${icon ? 'pl-10' : ''} 
            ${isPassword || rightIcon ? 'pr-10' : ''}
            ${error ? 'border-status-red focus:border-status-red focus:ring-status-red' : ''}
            ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-label dark:text-slate-400 hover:text-gray-text dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        {rightIcon && !isPassword && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-label dark:text-slate-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-status-red">{error}</p>}
    </div>
  );
};
