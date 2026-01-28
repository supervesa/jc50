import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import RelationList from './relationmanager/RelationList';
import RelationForm from './relationmanager/RelationForm';
import SplitManager from './relationmanager/SplitManager';
import RelationMatrix from './relationmanager/RelationMatrix'; // UUSI: Import

// Tyylit pääkonteinerille
const styles = {
  container: {
    paddingBottom: '4rem',
    color: '#eee',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  tabMenu: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid #333',
    paddingBottom: '10px',
    overflowX: 'auto' // Mobiili-scrollaus
  },
  tabBtn: (isActive) => ({
    background: isActive ? 'var(--turquoise)' : 'transparent',
    color: isActive ? '#000' : '#aaa',
    border: isActive ? 'none' : '1px solid #333',
    padding: '10px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s'
  })
};

function RelationManager({ characters = [] }) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('matrix'); // OLETUS: 'matrix' on nyt oletusnäkymä
  const [relationships, setRelationships] = useState([]);
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Muokkaustila: Jos tämä on asetettu, Form-komponentti on muokkausmoodissa
  const [editingRelation, setEditingRelation] = useState(null);

  // --- DATAN HAKU ---
  // Lisätään parametri: isBackgroundUpdate (oletus false)
  const fetchData = async (isBackgroundUpdate = false) => {
    
    // TÄRKEÄ MUUTOS: Jos tämä on taustapäivitys, ÄLÄ aseta loading-tilaa
    if (!isBackgroundUpdate) {
      setLoading(true);
    }

    try {
      const [relRes, splitRes] = await Promise.all([
        supabase.from('character_relationships').select('*'),
        supabase.from('guest_splits').select('*')
      ]);

      if (relRes.error) throw relRes.error;
      if (splitRes.error) throw splitRes.error;

      setRelationships(relRes.data || []);
      setSplits(splitRes.data || []);
    } catch (err) {
      console.error("Datan haku epäonnistui:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleEditClick = (rel) => {
    setEditingRelation(rel);
    setActiveTab('create'); // Siirry lomake-välilehdelle
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRelation(null);
    setActiveTab('list');
  };

  const handleSaveComplete = () => {
    fetchData(); // Päivitä lista
    setEditingRelation(null);
    setActiveTab('list'); // Palaa listaan
  };

  return (
    <div style={styles.container}>
      <h2 className="jc-h2" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #444', paddingBottom: '1rem' }}>
        Relaatioiden Hallinta
      </h2>

      {/* --- TAB NAVIGATION --- */}
      <div style={styles.tabMenu}>
        {/* UUSI: MATRIX TAB */}
        <button 
          style={styles.tabBtn(activeTab === 'matrix')} 
          onClick={() => setActiveTab('matrix')}
        >
          🔮 MATRIX (GOD VIEW)
        </button>

        <button 
          style={styles.tabBtn(activeTab === 'list')} 
          onClick={() => { setActiveTab('list'); setEditingRelation(null); }}
        >
          LISTAUS ({relationships.length})
        </button>
        
        <button 
          style={styles.tabBtn(activeTab === 'create')} 
          onClick={() => setActiveTab('create')}
        >
          {editingRelation ? 'MUOKKAA YHTEYTTÄ' : 'LUO UUSI'}
        </button>
        
        <button 
          style={styles.tabBtn(activeTab === 'splits')} 
          onClick={() => setActiveTab('splits')}
        >
          AVEC LINKITYKSET
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="jc-tab-content">
        {loading && <div style={{ padding: '20px', color: '#888' }}>Ladataan...</div>}

       {/* UUSI: MATRIX VIEW */}
        {!loading && activeTab === 'matrix' && (
          <RelationMatrix 
            characters={characters}
            relationships={relationships}
            splits={splits}
            // TÄRKEÄ MUUTOS: Kutsutaan fetchData(true), jolloin loading-ruutu ei välähdä
            onUpdate={() => fetchData(true)} 
          />
        )}

        {!loading && activeTab === 'list' && (
          <RelationList 
            relationships={relationships} 
            characters={characters} 
            onEdit={handleEditClick}
            onDelete={fetchData} 
          />
        )}

        {!loading && activeTab === 'create' && (
          <RelationForm 
            characters={characters}
            editingRelation={editingRelation}
            onCancel={handleCancelEdit}
            onSave={handleSaveComplete}
          />
        )}

        {!loading && activeTab === 'splits' && (
          <SplitManager 
            splits={splits} 
            characters={characters}
            onUpdate={fetchData}
          />
        )}
      </div>
    </div>
  );
}

export default RelationManager;