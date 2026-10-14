import React from 'react';

interface ChatPresenceIndicatorProps {
  isOnline: boolean;
  userName?: string;
  size?: number;
}

export const ChatPresenceIndicator: React.FC<ChatPresenceIndicatorProps> = ({ 
  isOnline, 
  userName,
  size = 8 
}) => {
  return (
    <span 
      title={userName ? `${userName} is ${isOnline ? 'Online' : 'Offline'}` : (isOnline ? 'Online' : 'Offline')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.72rem',
        color: isOnline ? '#15803d' : 'var(--color-content-tertiary)'
      }}
    >
      <span 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: isOnline ? '#15803d' : 'var(--color-content-disabled)',
          boxShadow: isOnline ? '0 0 0 2px rgba(34, 197, 94, 0.2)' : 'none',
          display: 'inline-block'
        }} 
      />
      {userName && <span>{isOnline ? 'Online' : 'Offline'}</span>}
    </span>
  );
};
