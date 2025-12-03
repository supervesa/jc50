import React from 'react';
// 1. Poistetaan moduulityylit
// import styles from './ThankYou.module.css'; 

function ThankYou() {
  return (
    // 2. Poistetaan turha container-div ja sen tyyli
    <div>
      {/* 3. Käytetään globaaleja tyyliluokkia */}
      <h2 className="jc-h2">Olet nyt osa Klubia!</h2>
      <p className="lead">
        Kiitos ilmoittautumisesta. Olet virallisesti listalla.
      </p>
      <p>
        Pidä sähköpostiasi silmällä. Saat vielä tärkeää lisätietoa ennen juhlia — muista tarkistaa myös roskaposti varmuuden vuoksi.
      </p>
    </div>
  );
}

export default ThankYou;