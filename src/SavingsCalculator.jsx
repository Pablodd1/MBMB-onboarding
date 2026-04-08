import React, { useState } from 'react';

const SavingsCalculator = ({ t }) => {
  const [monthlyBilling, setMonthlyBilling] = useState('');
  const [denialRate, setDenialRate] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [annualSavings, setAnnualSavings] = useState(0);

  const calculateSavings = () => {
    if (!monthlyBilling || !denialRate) {
      alert('Please fill in both fields');
      return;
    }

    const billing = parseFloat(monthlyBilling);
    const rate = parseFloat(denialRate);

    if (isNaN(billing) || isNaN(rate) || billing < 0 || rate < 0 || rate > 100) {
      alert('Please enter valid numbers');
      return;
    }

    setCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      // Calculate savings based on improving denial rate to 2% (98% clean claims)
      const currentDenied = billing * (rate / 100);
      const newDenied = billing * 0.02; // 2% denial rate with our service
      const monthlySavingsAmount = currentDenied - newDenied;
      const annualSavingsAmount = monthlySavingsAmount * 12;
      
      setMonthlySavings(monthlySavingsAmount);
      setAnnualSavings(annualSavingsAmount);
      setShowResults(true);
      setCalculating(false);
    }, 1000);
  };

  if (!showResults) {
    return (
      <div className="savings-calculator">
        <div className="calculator-card">
          <h3>{t.savingsCalculator.title}</h3>
          <p className="calculator-subtitle">{t.savingsCalculator.subtitle}</p>
          
          <div className="calculator-form">
            <div className="form-group">
              <label>{t.savingsCalculator.monthlyBilling}</label>
              <input
                type="number"
                placeholder="$0"
                value={monthlyBilling}
                onChange={(e) => setMonthlyBilling(e.target.value)}
                className="calculator-input"
              />
            </div>
            
            <div className="form-group">
              <label>{t.savingsCalculator.currentDenialRate}</label>
              <input
                type="number"
                placeholder="0%"
                value={denialRate}
                onChange={(e) => setDenialRate(e.target.value)}
                className="calculator-input"
              />
              <span className="help-text">{(denialRate ? `${denialRate}%` : '')} (e.g., 25 for 25%)</span>
            </div>
            
            <button 
              onClick={calculateSavings}
              disabled={calculating}
              className={`btn-primary ${calculating ? 'loading' : ''}`}
            >
              {calculating ? 'Calculating...' : t.savingsCalculator.calculateSavings}
            </button>
          </div>
          
          <div className="info-box">
            <p><strong>{t.savingsCalculator.cleanClaimRate}</strong></p>
            <p><strong>{t.savingsCalculator.industryAverage}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="savings-calculator">
      <div className="calculator-card results-card">
        <h3>{t.savingsCalculator.title}</h3>
        <p className="calculator-subtitle">{t.savingsCalculator.subtitle}</p>
        
        <div className="results-content">
          <div className="result-item">
            <h4>{t.savingsCalculator.potentialIncrease}</h4>
            <p className="result-value">${monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="result-label">Per Month</p>
          </div>
          
          <div className="result-item">
            <h4>{t.savingsCalculator.annualImpact}</h4>
            <p className="result-value">${annualSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="result-label">Per Year</p>
          </div>
          
          <div className="info-box">
            <p><strong>{t.savingsCalculator.cleanClaimRate}</strong></p>
            <p><strong>{t.savingsCalculator.industryAverage}</strong></p>
          </div>
          
          <button 
            onClick={() => setShowResults(false)}
            className="btn-secondary"
          >
            Calculate Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingsCalculator;