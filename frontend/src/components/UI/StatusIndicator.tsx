import React from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting';
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          className: 'status-badge online',
        };
      case 'connecting':
        return {
          icon: Loader,
          text: 'Connecting',
          className: 'status-badge loading',
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          className: 'status-badge offline',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.className} ${className}`}>
      <Icon className={`w-3 h-3 mr-1 ${status === 'connecting' ? 'animate-spin' : ''}`} />
      {config.text}
    </div>
  );
};

export default StatusIndicator;