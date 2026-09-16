import Link from 'next/link';

const TOKEN_PATTERN = /([#@][A-Za-z0-9À-ÿ._-]{2,50})/g;

export default function RichPostText({ text, className = '' }: { text: string; className?: string }) {
  return <p className={`whitespace-pre-wrap ${className}`}>{text.split(TOKEN_PATTERN).map((part, index) => {
    if (part.startsWith('#')) return <Link key={`${part}-${index}`} href={`/actualite/hashtag/${encodeURIComponent(part.slice(1).toLowerCase())}`} className="font-semibold text-reunion-blue hover:underline">{part}</Link>;
    if (part.startsWith('@')) return <Link key={`${part}-${index}`} href={`/joueurs/${encodeURIComponent(part.slice(1))}`} className="font-semibold text-reunion-blue hover:underline">{part}</Link>;
    return part;
  })}</p>;
}
