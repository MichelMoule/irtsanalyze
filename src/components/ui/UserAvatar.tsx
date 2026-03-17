interface UserAvatarProps {
  src?: string | null;
  nom?: string;
  prenom?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  bgColor?: string;
}

const sizes = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function UserAvatar({ src, nom, prenom, size = 'md', className = '', bgColor }: UserAvatarProps) {
  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase();
  const sizeClass = sizes[size];
  const bg = bgColor || 'bg-white/20';

  if (src) {
    return (
      <img
        src={src}
        alt={`${prenom ?? ''} ${nom ?? ''}`}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full ${bg} flex items-center justify-center font-bold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}
