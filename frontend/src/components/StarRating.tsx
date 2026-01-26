import { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'text-sm gap-0.5',
    md: 'text-lg gap-1',
    lg: 'text-2xl gap-1.5'
  };

  const handleClick = (star: number) => {
    if (!readonly && onChange) {
      onChange(star);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className={`transition-all duration-150 ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${
            star <= displayValue
              ? 'text-yellow-400'
              : 'text-[hsl(var(--muted-foreground))] opacity-40'
          }`}
          aria-label={`${star} estrelas`}
        >
          {star <= displayValue ? <FaStar /> : <FaRegStar />}
        </button>
      ))}
      {showValue && (
        <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">
          {value > 0 ? value.toFixed(1) : '4.3'}
        </span>
      )}
    </div>
  );
}
