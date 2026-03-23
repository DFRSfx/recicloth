import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface FloatingLabelInputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  icon?: LucideIcon;
}

const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  required = false,
  autoComplete = 'off',
  disabled = false,
  icon: Icon,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;
  const hasValue = value.length > 0;
  const shouldFloat = isFocused || hasValue;

  return (
    <div className="w-full relative">
      <label
        htmlFor={id}
        className={`absolute bg-white px-2 transition-all duration-200 pointer-events-none ${
          shouldFloat
            ? 'left-4 top-0 -translate-y-1/2 text-sm text-primary-600'
            : `${Icon ? 'left-14' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-500`
        }`}
      >
        {label} {required && '*'}
      </label>

      {Icon && (
        <Icon
          className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
            disabled ? 'text-gray-300' : isFocused ? 'text-primary-600' : 'text-gray-400'
          }`}
        />
      )}

      <input
        ref={ref}
        id={id}
        name={name}
        type={inputType}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`w-full p-5 border rounded-lg bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 ${
          Icon ? 'pl-14' : 'pl-5'
        } ${isPasswordField ? 'pr-12' : ''}`}
      />
      {isPasswordField && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
});

FloatingLabelInput.displayName = 'FloatingLabelInput';

export default FloatingLabelInput;
