import './Events.css';
import skaterImg from '../../assets/event-skater.jpg';

const events = [
  {
    id: 'murisserie-2026',
    title: 'Lüüd Discs @ La Mûrisserie',
    date: '2026-03-27',
    displayDate: '27.03.2026',
    lineup: [
      { name: 'Armless Kid', url: 'https://soundcloud.com/armlesskidmusic' },
      { name: 'Pechko', url: 'https://soundcloud.com/popopechko' },
      { name: 'KHALK', url: 'https://soundcloud.com/khalk' },
    ],
    venue: 'La Mûrisserie',
    address: '44 cr Julien, 13006 Marseille',
    doors: '20h → 2h',
    price: '5€ à partir de 22h',
    image: skaterImg,
    status: 'upcoming',
  },
];

const Events = () => {
  return (
    <div className="events-list">
      {events.map((event) => (
        <article key={event.id} className="event-card">
          <div className="sunset-bar" aria-hidden="true" />
          <div className="event-visual">
            <img
              src={event.image}
              alt={`${event.title} - visual`}
              className="event-image"
              loading="lazy"
            />
            <div className="event-image-overlay" />
          </div>

          <div className="event-info">
            <div className="event-date-badge">
              <span className="event-status">● UPCOMING</span>
              <span className="event-date">{event.displayDate}</span>
            </div>

            <div className="event-lineup">
              <span className="lineup-label">lineup:</span>
              {event.lineup.map((artist, i) => (
                <a
                  key={i}
                  href={artist.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lineup-artist"
                  aria-label={`${artist.name} on Soundcloud`}
                >
                  {artist.name}
                </a>
              ))}
            </div>

            <div className="event-details">
              <div className="detail-row">
                <span className="flag">--venue</span>
                <span className="val">{event.venue}</span>
              </div>
              <div className="detail-row">
                <span className="flag">--addr</span>
                <span className="val">{event.address}</span>
              </div>
              <div className="detail-row">
                <span className="flag">--doors</span>
                <span className="val">{event.doors}</span>
              </div>
              <div className="detail-row">
                <span className="flag">--paf</span>
                <span className="val">{event.price}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default Events;
