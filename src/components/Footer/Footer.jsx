import React from 'react';
// 1. Poistetaan moduulityylien tuonti
// import styles from './Footer.module.css';

function Footer() {
  return (
    // 2. Vaihdetaan luokaksi "jc-footer"
    <footer className="jc-footer">
      <p>© 2025 JC - Jukka Club</p>
    </footer>
  );
}

// 3. Lisätään pakollinen export
export default Footer;