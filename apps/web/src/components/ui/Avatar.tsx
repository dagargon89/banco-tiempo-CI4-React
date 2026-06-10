interface AvatarProps {
  src?: string | null;
  nombre: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function Avatar({ src, nombre, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizes[size];

  if (src) {
    return (
      <img
        src={src}
        alt={nombre}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-surface ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-accent font-semibold text-white ring-2 ring-surface ${className}`}
    >
      {getInitials(nombre)}
    </div>
  );
}
