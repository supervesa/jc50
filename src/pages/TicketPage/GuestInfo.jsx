import React from 'react';
import './TicketPage.css';

function GuestInfo({ guest, formData, setFormData, isEditing, setIsEditing, onSave }) {
  return (
    <section className="jc-card small">
      <div className="guest-header">
        <h3 className="guest-title">Omat tiedot</h3>
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          className="jc-cta ghost btn-ghost-small"
        >
          {isEditing ? 'Peruuta' : 'Muokkaa'}
        </button>
      </div>
      
      {isEditing ? (
        <div className="jc-form">
          <div className="jc-field">
            <label>Nimi</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div className="jc-field">
            <label className="jc-check">
              <input 
                type="checkbox" 
                checked={formData.brings_spouse} 
                onChange={e => setFormData({...formData, brings_spouse: e.target.checked})} 
              />
              <span className="box"></span> Saavun puolison kanssa
            </label>
          </div>
          {formData.brings_spouse && (
            <div className="jc-field">
              <label>Puolison nimi</label>
              <input 
                type="text" 
                value={formData.spouse_name} 
                onChange={e => setFormData({...formData, spouse_name: e.target.value})} 
              />
            </div>
          )}
          <div className="jc-field">
            <label>Erityisruokavaliot</label>
            <textarea 
              value={formData.dietary_restrictions} 
              onChange={e => setFormData({...formData, dietary_restrictions: e.target.value})} 
            />
          </div>
          <button onClick={onSave} className="jc-cta primary save-btn">Tallenna</button>
        </div>
      ) : (
        <div className="guest-details">
          <p><strong>Nimi:</strong> {guest.name}</p>
          <p><strong>Avec:</strong> {guest.brings_spouse ? `Kyllä (${guest.spouse_name})` : 'Ei'}</p>
          <p><strong>Allergiat:</strong> {guest.dietary_restrictions || '-'}</p>
        </div>
      )}
    </section>
  );
}

export default GuestInfo;