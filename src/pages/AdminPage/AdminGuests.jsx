import React from 'react';

const AdminGuests = ({ guests }) => {
  const BASE_URL = window.location.origin + '/agent?id='; 

  const copyLink = (id) => { 
    navigator.clipboard.writeText(`${BASE_URL}${id}`); 
    alert('Kopioitu!'); 
  };

  return (
    <div className="admin-section">
      <h2>VIERASLISTA</h2>
      <div className="guest-list-container">
        {guests.map(g => (
          <div key={g.id} className="guest-row">
            <span className="guest-name">{g.name}</span>
            <button className="btn-copy-link" onClick={() => copyLink(g.id)}>🔗 LINKKI</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGuests;