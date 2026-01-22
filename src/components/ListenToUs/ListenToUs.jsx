import "./ListenToUs.css";
import ReleaseCard from "../ReleaseCard/ReleaseCard";
import releases from "../../data/releases";

const ListenToUs = () => {
  return (
    <section className="listen-to-us" aria-labelledby="releases-heading">
      <h2 id="releases-heading" className="visually-hidden">
        Releases
      </h2>
      <div className="releases-grid">
        {releases.map((release) => (
          <ReleaseCard key={release.id} release={release} />
        ))}
      </div>
    </section>
  );
};

export default ListenToUs;
