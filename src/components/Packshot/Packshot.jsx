
import packshot1 from '../../assets/f_unloved_1_1.webp';
import packshot2 from '../../assets/f_unloved_2_1.webp';
import './Packshot.css';

const Packshot = () => {
  return (
    <div className="packshot-container">
      <img src={packshot1} alt="F. Unloved EP vinyl front cover" className="packshot1" />
      <img src={packshot2} alt="F. Unloved EP vinyl back cover" className="packshot2" />
    </div>
  );
};

export default Packshot;