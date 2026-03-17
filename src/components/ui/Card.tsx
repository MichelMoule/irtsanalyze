import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  onClick
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg p-6',
        hover && 'cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
