import { protectedMediaUrl } from '@/lib/media';
import { classNames } from '@/lib/utils';

export default function ProfileAvatar({
  username,
  avatarPath,
  size = 'md',
  className,
}: {
  username?: string | null;
  avatarPath?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-20 w-20 text-2xl', xl: 'h-32 w-32 text-4xl sm:h-40 sm:w-40 sm:text-5xl' };
  const src = protectedMediaUrl(avatarPath);
  return (
    <span className={classNames('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-reunion-blue/20 via-white to-reunion-yellow/30 font-display font-semibold text-reunion-blue ring-1 ring-ink-200', sizes[size], className)}>
      {src ? <img src={src} alt={`Photo de ${username ?? 'membre'}`} className="h-full w-full object-cover" /> : (username?.slice(0, 2).toUpperCase() ?? 'VP')}
    </span>
  );
}
