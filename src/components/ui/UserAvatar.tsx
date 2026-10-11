import React, { useState, useEffect } from 'react';
import { getUserInitials } from '../../lib/userUtils';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  roundedClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'User Avatar',
  name,
  className = 'w-8 h-8',
  fallbackClassName = 'bg-gradient-to-br from-primary to-teal-500 text-white font-bold text-xs',
  roundedClassName = 'rounded-full',
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = getUserInitials(name || alt);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${className} ${roundedClassName} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} ${roundedClassName} ${fallbackClassName} flex items-center justify-center shadow-xs select-none`}
    >
      {initials}
    </div>
  );
};
