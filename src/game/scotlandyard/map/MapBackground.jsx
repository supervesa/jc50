import React from 'react';
import styles from '../styles.module.css';

const cls = (...classes) => classes.filter(Boolean).join(' ');

const MapBackground = ({ activeFloor, onRoomClick }) => {
  
  const showF1 = activeFloor === 1 ? { display: 'block' } : { display: 'none' };
  const showF2 = activeFloor === 2 ? { display: 'block' } : { display: 'none' };

  return (
    <>
      {/* --- KERROS 1 (ALAKERTA) --- */}
      <g id="floor-1-layer" style={showF1}>
        
        <g className={styles.roomGroup} onClick={() => onRoomClick('akvaario')} transform="matrix(0.809725,0,0,0.969336,69.669591,-89.769306)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorBlue)} />
          <text x="546" y="490" className={styles.roomLabel}>Akvaariohuone</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('keittio')} transform="matrix(0.809725,0,0,1.37138,68.6633,406.277127)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorRed)} />
          <text x="546" y="490" className={styles.roomLabel}>Keittiö</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('lounge')} transform="matrix(0.832981,0,0,1.816014,835.453452,667.889579)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorPink)} />
          <text x="546" y="490" className={styles.roomLabel}>Lounge</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('eteinen')} transform="matrix(0.790698,0,0,1.549066,829.888555,-211.335796)">
          <path d="M1015.037,783L73,783L73,196L1019,196L1019,518.16L2034.39,518.16L2034.39,791.168L1015.037,791.168L1015.037,783Z" className={cls(styles.roomRect, styles.colorYellow)} />
          <text x="1050" y="490" className={styles.roomLabel} style={{ fontSize: '100px' }}>Eteinen</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('ruokailutila')} transform="matrix(0.809725,0,0,1.061329,71.713353,1256.618911)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorPaleRed)} />
          <text x="546" y="490" className={styles.roomLabel}>Ruokailutila</text>
        </g>

        {/* PORTAIKKO (ALAPÄÄ) -> Vie 'portaikko' solmuun */}
        <g className={styles.roomGroup} onClick={() => onRoomClick('portaikko')} transform="matrix(0.413319,0,0,0.873935,1610.437181,-73.010109)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorBrown)} />
          <text x="546" y="490" className={styles.roomLabel}>Portaikko</text>
        </g>
      </g>


      {/* --- KERROS 2 (YLÄKERTA) --- */}
      <g id="floor-2-layer" style={showF2}>
        
        <g className={styles.roomGroup} onClick={() => onRoomClick('olohuone')} transform="matrix(0.801268,0,0,1.468484,1620.768463,737.005422)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorPink)} />
          <text x="546" y="490" className={styles.roomLabel}>Olohuone</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('kylpyhuone')} transform="matrix(0.466173,0,0,0.855196,2083.748872,-67.397926)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorDarkRed)} />
          <text x="546" y="490" className={styles.roomLabel}>Kylpyhuone</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('parveke')} transform="matrix(1.842495,0,0,0.778535,1539.438189,1723.340767)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorPaleRed)} />
          <text x="546" y="490" className={styles.roomLabel}>Parveke</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('makuuhuone')} transform="matrix(1.027484,0,0,1.451448,2360.691995,737.922016)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorGrey)} />
          <text x="546" y="490" className={styles.roomLabel}>Makuuhuone</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('vaatehuone')} transform="matrix(0.552854,0,0,0.972743,2854.574732,264.003396)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorDeepRed)} />
          <text x="546" y="490" className={styles.roomLabel}>Vaatehuone</text>
        </g>

        <g className={styles.roomGroup} onClick={() => onRoomClick('varasto')} transform="matrix(0.913319,0,0,0.623509,2488.003777,-28.314306)">
           <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorMetal)} />
           <text x="546" y="490" className={styles.roomLabel} style={{ fontSize: '60px' }}>Varasto</text>
        </g>

        {/* PORTAIKKO (YLÄPÄÄ) -> Vie samaan 'portaikko' solmuun */}
        <g className={styles.roomGroup} onClick={() => onRoomClick('portaikko')} transform="matrix(0.413319,0,0,0.873935,1610.437181,-73.010109)">
          <rect x="73" y="196" width="946" height="587" className={cls(styles.roomRect, styles.colorBrown)} />
          <text x="546" y="490" className={styles.roomLabel}>Portaikko</text>
        </g>
      </g>
    </>
  );
};

export default MapBackground;