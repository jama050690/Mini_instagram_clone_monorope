import { useNavigate } from 'react-router-dom';

interface CaptionTextProps {
  username: string;
  caption: string;
  className?: string;
}

/** Caption matnini render qiladi, #hashtag larni kliklanadigan chip sifatida ko'rsatadi. */
export function CaptionText({ username, caption, className }: CaptionTextProps) {
  const navigate = useNavigate();
  const parts = caption.split(/(#[a-zA-Z0-9_Ѐ-ӿ]{1,100})/g);

  return (
    <p className={className}>
      <span className="font-semibold text-gray-900">{username} </span>
      {parts.map((part, i) => {
        if (/^#[a-zA-Z0-9_Ѐ-ӿ]{1,100}$/.test(part)) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => navigate(`/hashtags/${encodeURIComponent(part.slice(1).toLowerCase())}`)}
              className="font-semibold text-violet-600 hover:text-violet-800 hover:underline"
            >
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
