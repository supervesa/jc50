import React, { useState } from 'react';
// import styles from './Registration.module.css'; // <-- 1. Poistetaan moduulityylit
import RegistrationForm from '../../components/RegistrationForm/RegistrationForm.jsx';
import ThankYou from '../../components/ThankYou/ThankYou.jsx';

function Registration() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSuccess = () => {
    setIsSubmitted(true);
  };

  return (
    // 2. Vaihdetaan luokaksi "jc-card" ja lisätään vähän marginaalia
    <section className="jc-card mt-2 mb-2">
      
      {!isSubmitted ? (
        <>
          {/* 3. Käytetään globaaleja typografialuokkia */}
          <h2 className="jc-h2">Ilmoittaudu Klubiin</h2>
          <p className="lead">Vahvista osallistumisesi ja lunasta paikkasi sisäpiirissä.</p>
          
          {/* Tämä komponentti pitää päivittää seuraavaksi */}
          <RegistrationForm onSuccess={handleSuccess} />
        </>
      ) : (
        // Tämäkin komponentti voidaan päivittää myöhemmin
        <ThankYou />
      )}
    </section>
  );
}

export default Registration;