import React, { useEffect, useState } from 'react';
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  isMobile?: boolean;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose,
  isMobile = false
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
      buttonBg: 'bg-green-600',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
      buttonBg: 'bg-red-600',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
      buttonBg: 'bg-blue-600',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
      buttonBg: 'bg-yellow-600',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor, buttonBg } = config[type];

  // Mobile modal style (SweetAlert-like)
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-[100] ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-sm bg-white rounded-2xl shadow-2xl z-[101] p-6 ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`rounded-full p-4 ${bgColor}`}>
              <Icon className={`h-12 w-12 ${iconColor}`} />
            </div>
            
            <p className={`${textColor} font-semibold text-lg`}>{message}</p>

            <button
              onClick={handleClose}
              className={`w-full ${buttonBg} text-white py-3 px-6 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity`}
            >
              OK
            </button>
          </div>
        </div>
      </>
    );
  }

  // Desktop toast style
  return (
    <div
      className={`fixed top-20 right-4 md:top-24 md:right-6 z-[100] max-w-sm w-full ${isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'}`}
    >
      <div
        className={`${bgColor} ${borderColor} border-l-4 rounded-lg shadow-xl p-4 flex items-start gap-3`}
      >
        <Icon className={`h-6 w-6 ${iconColor} flex-shrink-0`} />
        <div className="flex-1">
          <p className={`${textColor} font-medium text-sm md:text-base`}>{message}</p>
        </div>
        <button
          onClick={handleClose}
          className={`${iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Fechar notificação"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${
            type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' :
            type === 'info' ? 'bg-blue-600' :
            'bg-yellow-600'
          } animate-shrink`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export default Toast;
