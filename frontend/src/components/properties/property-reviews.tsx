import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Review } from '@/lib/types';

interface PropertyReviewsProps {
  reviews: Review[];
  totalReviews: number;
}

export function PropertyReviews({ reviews, totalReviews }: PropertyReviewsProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Avaliações ({totalReviews})
      </h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={review.userPhoto} />
                <AvatarFallback>{review.userName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{review.userName}</p>
                <p className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{review.rating}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
