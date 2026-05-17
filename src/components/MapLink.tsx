import { MapPin } from 'lucide-react';
import { VacationEvent } from '../types';

interface MapLinkProps {
  event: VacationEvent;
}

export default function MapLink({ event }: MapLinkProps) {
  if (!event.address && (!event.coordinates || !event.location)) {
    return null;
  }

  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  let href = '';
  if (isMobile && event.coordinates) {
    href = `geo:${event.coordinates[0]},${event.coordinates[1]}?q=(${encodeURIComponent(event.location || event.title)})`;

  } else {
    const query = event.coordinates
      ? `${event.coordinates[0]},${event.coordinates[1]}`
      : (event.address || event.location || event.title || '');
    href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return (
    <div className="flex items-start gap-2 text-slate-900 dark:text-slate-50 text-sm mb-2">
      <MapPin size={16} className="mt-0.5 shrink-0" />
      <div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 text-xs flex items-center gap-1 mt-1 hover:text-blue-600 hover:underline transition-colors"
        >
          {event.location || event.address}
        </a>
      </div>
    </div>
  );
}
