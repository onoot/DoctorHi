// src/components/common/SearchBox.jsx
import React, { useState } from 'react';

const SearchBox = ({ onSearch, placeholder = 'Search...' }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <div className="search-box">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="search-btn" onClick={handleSubmit}>
        <i className="fas fa-search"></i> Search
      </button>
    </div>
  );
};

export default SearchBox;