import React from 'react';
// import styles from './InfoSection.module.css'; // <-- 1. Poistetaan moduulityylit
import InfoCard from '../../components/InfoCard/InfoCard.jsx';

function InfoSection() {
  return (
    // 2. Käytetään globaalia grid-luokkaa ja lisätään vähän marginaalia
    <section className="jc-grid mb-2">
      
      {/* 3. Määritellään jokaiselle kortille oma sarake (4/12) */}
      <div className="jc-col-4">
        <InfoCard title="Milloin?">
          Lauantaina 15. Joulukuuta<br />
          Kello 18:00 alkaen
        </InfoCard>
      </div>
      
      <div className="jc-col-4">
        <InfoCard title="Missä?">
          Salainen Klubi<br />
          Mikonkatu 13, Helsinki<br />
          (Ovikoodi 1975)
        </InfoCard>
      </div>
      
      <div className="jc-col-4">
        <InfoCard title="Pukukoodi?">
          Neon Gatsby<br />
          Ajattele 1920-lukua... tulevaisuudessa.
        </InfoCard>
      </div>

    </section>
  );
}

export default InfoSection;