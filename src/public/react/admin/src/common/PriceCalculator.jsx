import React, { useState, useEffect } from 'react';

const DEFAULT_PKR_TO_USD = 0.0036; // default conversion rate

const PriceCalculator = ({ pricePKR, area, onPriceChange, disabled = false, pkrToUsdRate = DEFAULT_PKR_TO_USD }) => {
  const [rate, setRate] = useState(pkrToUsdRate);

  useEffect(() => {
    setRate(pkrToUsdRate);
  }, [pkrToUsdRate]);

  const numericPrice = Number(pricePKR) || 0;
  const numericArea = Number(area) || 0;
  const priceUSD = numericPrice * rate;
  const perSqftPKR = (numericArea > 0 ? numericPrice / numericArea : 0);
  const perSqftUSD = perSqftPKR * rate;

  return (
    <div className="price-calculator">
      <div className="form-row">
        <div className="form-group">
          <label>Price (PKR)</label>
          {onPriceChange && !disabled ? (
            <input className="form-control" type="number" value={pricePKR || ''} onChange={(e) => onPriceChange(e.target.value)} />
          ) : (
            <input className="form-control" type="text" value={pricePKR ? Number(pricePKR).toLocaleString() : ''} disabled />
          )}
        </div>
        <div className="form-group">
          <label>Rate (PKR → USD)</label>
          <input className="form-control" type="number" step="0.0001" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Price (USD)</label>
          <input className="form-control" type="text" value={priceUSD ? priceUSD.toFixed(2) : ''} disabled />
        </div>
        <div className="form-group">
          <label>Price / sqft (PKR)</label>
          <input className="form-control" type="text" value={perSqftPKR ? perSqftPKR.toFixed(2) : ''} disabled />
        </div>
        <div className="form-group">
          <label>Price / sqft (USD)</label>
          <input className="form-control" type="text" value={perSqftUSD ? perSqftUSD.toFixed(2) : ''} disabled />
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;
