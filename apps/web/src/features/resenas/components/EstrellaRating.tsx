import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  readonly?: boolean;
}

export default function EstrellaRating({ value, onChange, size = 'md', readonly = false }: Props) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}`}
        >
          <Star
            className={`${iconSize} ${
              star <= value
                ? 'fill-warning text-warning'
                : 'fill-none text-text-3'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
