// src/components/common/WitnessForm.jsx
import React from 'react';

const WitnessForm = ({ witness, onChange, index }) => {
  const prefix = `witness${index}`;
  return (
    <div className="witness-block">
      <h4>Witness {index}</h4>
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          className="form-control"
          value={witness.name || ''}
          onChange={(e) => onChange(prefix, 'name', e.target.value)}
          placeholder="Enter witness name"
        />
      </div>
      <div className="form-group">
        <label>CNIC *</label>
        <input
          type="text"
          className="form-control"
          value={witness.cnic || ''}
          onChange={(e) => onChange(prefix, 'cnic', e.target.value)}
          placeholder="XXXXX-XXXXXXX-X"
        />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input
          type="text"
          className="form-control"
          value={witness.phone || ''}
          onChange={(e) => onChange(prefix, 'phone', e.target.value)}
          placeholder="+XXXXXXXXXXXX"
        />
      </div>
    </div>
  );
};

export default WitnessForm;