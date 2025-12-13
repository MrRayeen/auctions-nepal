import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'pill';
}

export default function VerifiedBadge({ isVerified, size = 'md', variant = 'icon' }: VerifiedBadgeProps) {
  if (!isVerified) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  if (variant === 'pill') {
    return (
      <div
        title="KYC Verified Seller"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-3 py-1 rounded-full shadow-md border-0"
      >
        <span className="inline-flex items-center justify-center w-5 h-5 bg-white/10 rounded-full">
          <Check className="w-3 h-3 text-white" />
        </span>
        <span className="text-xs md:text-sm">Verified Seller</span>
      </div>
    );
  }

  return (
    <div
      title="KYC Verified"
      className={`inline-flex items-center justify-center ${sizeClasses[size]} bg-nepal-accent rounded-full`}
    >
      <Check className="w-3/4 h-3/4 text-white" />
    </div>
  );
}
