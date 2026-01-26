import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from './StarRating';

interface LessonRatingModalProps {
  isOpen: boolean;
  lessonTitle: string;
  onSubmit: (rating: number) => void;
  onCancel?: () => void;
}

export default function LessonRatingModal({
  isOpen,
  lessonTitle,
  onSubmit,
  onCancel
}: LessonRatingModalProps) {
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating);
      setRating(0);
    }
  };

  const handleCancel = () => {
    setRating(0);
    onCancel?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="card p-8 space-y-6">
              {/* Header */}
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))] mb-2">
                  Avalie esta aula
                </p>
                <h3 className="text-xl font-semibold line-clamp-2">
                  {lessonTitle}
                </h3>
              </div>

              {/* Stars */}
              <div className="flex justify-center py-4">
                <StarRating
                  value={rating}
                  onChange={setRating}
                  size="lg"
                />
              </div>

              {/* Helper text */}
              <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                {rating === 0
                  ? 'Selecione de 1 a 5 estrelas'
                  : rating <= 2
                  ? 'O que podemos melhorar?'
                  : rating <= 4
                  ? 'Obrigado pelo feedback!'
                  : 'Excelente! Ficamos felizes!'}
              </p>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="btn-accent w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {rating === 0
                  ? 'Selecione uma nota'
                  : `Enviar (${rating} ${rating === 1 ? 'estrela' : 'estrelas'})`}
              </button>

              {/* Cancel link */}
              {onCancel && (
                <button
                  onClick={handleCancel}
                  className="w-full text-center text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
