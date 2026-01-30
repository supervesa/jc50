import React, { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabaseClient";

const AdminScoring = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase
      .from('game_rules')
      .select('value')
      .eq('rule_key', 'xp_config')
      .single();
    
    if (data) setConfig(data.value);
    setLoading(false);
  };

  const updateValue = (key, val) => {
    setConfig(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  const saveRules = async () => {
    const { error } = await supabase
      .from('game_rules')
      .update({ value: config, updated_at: new Date() })
      .eq('rule_key', 'xp_config');

    if (error) alert("Virhe tallennuksessa: " + error.message);
    else alert("Pisteytys päivitetty onnistuneesti!");
  };

  if (loading) return <div className="admin-loading">Ladataan sääntöjä...</div>;

  return (
    <div className="admin-card scoring-panel">
      <h2 className="scoring-title">🏆 PISTEYTYKSEN HALLINTA</h2>
      <p className="scoring-subtitle">Muutokset päivittyvät välittömästi uusiin suorituksiin.</p>

      {/* --- PELITEHTÄVÄT --- */}
      <div className="scoring-grid">
        <div className="scoring-group">
          <label>Henkilökohtainen tavoite (XP)</label>
          <input type="number" value={config.personal_objective} onChange={e => updateValue('personal_objective', e.target.value)} />
        </div>
        
        <div className="scoring-group">
          <label>Hahmon löytäminen (XP)</label>
          <input type="number" value={config.find_role} onChange={e => updateValue('find_role', e.target.value)} />
        </div>

        <div className="scoring-group">
          <label>Flash Mob (XP)</label>
          <input type="number" value={config.flash_mob} onChange={e => updateValue('flash_mob', e.target.value)} />
        </div>

        <div className="scoring-group">
          <label>Flash Photo / FOTO (XP)</label>
          <input type="number" value={config.flash_photo || 200} onChange={e => updateValue('flash_photo', e.target.value)} />
        </div>

        <div className="scoring-group">
          <label>Flash Race / NOPEUS (XP)</label>
          <input type="number" value={config.flash_race} onChange={e => updateValue('flash_race', e.target.value)} />
        </div>
      </div>

      {/* --- UUSI OSIO: SOSIAALISET --- */}
      <hr className="scoring-divider" style={{margin: '20px 0', border: '0', borderTop: '1px solid #444'}} />
      
      <h3 style={{color: '#aaa', fontSize: '14px', marginBottom: '10px'}}>📱 SOSIAALISET & BONUS</h3>
      <div className="scoring-grid">
        <div className="scoring-group">
          <label>Profiilikuva (XP)</label>
          <input 
            type="number" 
            value={config.avatar_bonus || 150} 
            onChange={e => updateValue('avatar_bonus', e.target.value)} 
          />
        </div>

        <div className="scoring-group">
          <label>Some-aktiivisuus (XP)</label>
          <span className="input-hint">Paparazzi / Chat palkinto</span>
          <input 
            type="number" 
            value={config.social_active || 10} 
            onChange={e => updateValue('social_active', e.target.value)} 
          />
        </div>

        <div className="scoring-group">
          <label>Some-suosio / Hot (XP)</label>
          <span className="input-hint">Trendsetter palkinto</span>
          <input 
            type="number" 
            value={config.social_hot || 25} 
            onChange={e => updateValue('social_hot', e.target.value)} 
          />
        </div>
      </div>

      {/* --- VIRSTANPYLVÄÄT --- */}
      <div className="milestone-section">
        <h3>🎖️ Virstanpylväät (Löydetyt agentit)</h3>
        {config.milestones.map((ms, index) => (
          <div key={index} className="milestone-row">
            <span>{ms.count} roolia =</span>
            <input 
              type="number" 
              value={ms.bonus} 
              onChange={e => {
                const newMs = [...config.milestones];
                newMs[index].bonus = parseInt(e.target.value) || 0;
                setConfig({...config, milestones: newMs});
              }}
            />
            <span>XP</span>
          </div>
        ))}
      </div>

      <button onClick={saveRules} className="btn-save-scoring">
        TALLENNA PISTEYTYS
      </button>
    </div>
  );
};

export default AdminScoring;