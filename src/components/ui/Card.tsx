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
        'bg-white rounded-xl border border-shine-border p-6',
        hover && 'cursor-pointer hover:shadow-card transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
