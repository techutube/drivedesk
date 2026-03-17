'use client';

import { useState } from 'react';

export default function FinanceCalculatorPage() {
  const [carPrice, setCarPrice] = useState(1000000);
  const [downPayment, setDownPayment] = useState(200000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(5);

  const calculateEMI = () => {
    const loanAmount = carPrice - downPayment;
    if (loanAmount <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0, loanAmount: 0 };
    
    // Monthly interest rate
    const r = (interestRate / 12) / 100;
    // Total months
    const n = tenureYears * 12;
    
    // EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    const totalPayment = emi * n;
    const totalInterest = totalPayment - loanAmount;

    return { emi: Math.round(emi), totalInterest: Math.round(totalInterest), totalPayment: Math.round(totalPayment), loanAmount };
  };

  const results = calculateEMI();

  return (
    <div className="finance-page">
      <div className="page-header">
        <h2>Finance & EMI Calculator</h2>
      </div>

      <div className="calculator-layout">
        <div className="card form-card">
          <h3>Input Details</h3>
          <div className="form-group mt-4">
            <label>On-Road Price (₹)</label>
            <input type="number" min="0" value={carPrice} onChange={e => setCarPrice(Number(e.target.value))} />
            <input type="range" className="w-full mt-2" min="100000" max="5000000" step="50000" value={carPrice} onChange={e => setCarPrice(Number(e.target.value))} />
          </div>

          <div className="form-group mt-4">
            <label>Down Payment (₹)</label>
            <input type="number" min="0" max={carPrice} value={downPayment} onChange={e => setDownPayment(Math.min(carPrice, Number(e.target.value)))} />
            <input type="range" className="w-full mt-2" min="0" max={carPrice} step="10000" value={downPayment} onChange={e => setDownPayment(Math.min(carPrice, Number(e.target.value)))} />
          </div>

          <div className="form-group mt-4">
            <label>Interest Rate (% p.a.)</label>
            <input type="number" step="0.1" min="1" max="25" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} />
          </div>

          <div className="form-group mt-4">
            <label>Loan Tenure (Years)</label>
            <select value={tenureYears} onChange={e => setTenureYears(Number(e.target.value))}>
              <option value="1">1 Year (12 months)</option>
              <option value="2">2 Years (24 months)</option>
              <option value="3">3 Years (36 months)</option>
              <option value="4">4 Years (48 months)</option>
              <option value="5">5 Years (60 months)</option>
              <option value="6">6 Years (72 months)</option>
              <option value="7">7 Years (84 months)</option>
            </select>
          </div>
        </div>

        <div className="card results-card">
          <h3>EMI Breakdown</h3>
          <div className="results-content mt-4">
            <div className="emi-highlight">
              <span className="label">Monthly EMI</span>
              <span className="value">₹{results.emi.toLocaleString('en-IN')}</span>
            </div>

            <div className="breakdown-grid mt-6">
              <div className="breakdown-item">
                <span className="label">Principal Loan Amount</span>
                <span className="value">₹{results.loanAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Total Interest Payable</span>
                <span className="value text-danger">₹{results.totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="breakdown-item total">
                <span className="label">Total Amount Payable</span>
                <span className="value">₹{results.totalPayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="chart-visualization mt-6">
              {/* Visual representation of Principal vs Interest */}
              {results.loanAmount > 0 && (
                <div className="progress-bar">
                  <div className="principal-bar" style={{ width: (results.loanAmount / results.totalPayment) * 100 + '%' }}></div>
                  <div className="interest-bar" style={{ width: (results.totalInterest / results.totalPayment) * 100 + '%' }}></div>
                </div>
              )}
              <div className="legend">
                <span className="legend-item"><span className="dot principal"></span> Principal</span>
                <span className="legend-item"><span className="dot interest"></span> Interest</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .finance-page {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }
        .page-header h2 {
          color: var(--text-primary);
          font-weight: 700;
        }
        
        .calculator-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-lg);
          align-items: start;
        }

        .card {
          background: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: var(--spacing-xl);
          border: 1px solid var(--border-color);
        }

        .card h3 {
          color: var(--brand-blue);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        .form-group label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .form-group input[type="number"], .form-group select {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 1.125rem;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--brand-blue);
          outline: none;
        }
        
        .w-full { width: 100%; }
        
        /* Range slider styling */
        input[type=range] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--brand-blue);
          cursor: pointer;
          margin-top: -6px;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #e5e7eb;
          border-radius: 2px;
        }

        /* Results Area */
        .emi-highlight {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 1.5rem;
          border-radius: var(--radius-md);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .emi-highlight .label {
          color: #1e3a8a;
          font-size: 1rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .emi-highlight .value {
          color: var(--brand-blue);
          font-size: 3rem;
          font-weight: 800;
        }

        .breakdown-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding-bottom: 0.75rem;
          border-bottom: 1px dashed var(--border-color);
        }
        .breakdown-item.total {
          border-bottom: none;
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--text-primary);
        }
        .breakdown-item .value { font-weight: 600; }
        .text-danger { color: #dc2626 !important; }

        .progress-bar {
          display: flex;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
          background: #e5e7eb;
        }
        .principal-bar { background-color: var(--brand-blue); }
        .interest-bar { background-color: #f59e0b; }
        
        .legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot.principal { background-color: var(--brand-blue); }
        .dot.interest { background-color: #f59e0b; }

        @media (max-width: 768px) {
          .calculator-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
