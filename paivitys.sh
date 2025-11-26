#!/bin/bash

echo "--- Luodaan puuttuva InfoCard-komponentti ---"

# 1. Varmista, että kansio on olemassa
mkdir -p src/components/InfoCard

# 2. Luo komponentin JSX-tiedosto
cat > src/components/InfoCard/InfoCard.jsx << EOM
import React from 'react';
import styles from './InfoCard.module.css';

// Tämä komponentti ottaa 'title' ja 'children' propsit
// 'children' on kaikki se, mitä kirjoitetaan tagien väliin
function InfoCard({ title, children }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
}

export default InfoCard;
EOM

# 3. Luo komponentin CSS-moduuli
cat > src/components/InfoCard/InfoCard.module.css << EOM
.card {
  background-color: #1a1a1a;
  border: 1px solid var(--color-accent-gold);
  padding: 1.5rem;
  border-radius: 4px;
  text-align: center;
}

.cardTitle {
  font-family: var(--font-heading);
  color: var(--color-neon-secondary);
  text-shadow: var(--shadow-neon-secondary);
  font-size: 1.75rem;
  margin-bottom: 1rem;
}

.cardContent {
  font-family: var(--font-body);
  color: var(--color-text-primary);
  font-size: 1rem;
  line-height: 1.7;
}
EOM

echo "✅ InfoCard.jsx ja InfoCard.module.css luotu."
echo "Käynnistä palvelin uudelleen (npm run dev)."