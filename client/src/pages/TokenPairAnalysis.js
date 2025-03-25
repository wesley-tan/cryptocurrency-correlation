import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './TokenPairAnalysis.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Common cryptocurrency tokens with their CoinGecko IDs
const COMMON_TOKENS = [
  { id: 'bitcoin', name: 'Bitcoin (BTC)' },
  { id: 'ethereum', name: 'Ethereum (ETH)' },
  { id: 'tether', name: 'Tether (USDT)' },
  { id: 'binancecoin', name: 'BNB' },
  { id: 'ripple', name: 'XRP' },
  { id: 'usd-coin', name: 'USD Coin (USDC)' },
  { id: 'staked-ether', name: 'Lido Staked Ether (STETH)' },
  { id: 'dogecoin', name: 'Dogecoin (DOGE)' },
  { id: 'cardano', name: 'Cardano (ADA)' },
  { id: 'solana', name: 'Solana (SOL)' },
  { id: 'tron', name: 'TRON (TRX)' },
  { id: 'polkadot', name: 'Polkadot (DOT)' },
  { id: 'matic-network', name: 'Polygon (MATIC)' },
  { id: 'litecoin', name: 'Litecoin (LTC)' },
  { id: 'shiba-inu', name: 'Shiba Inu (SHIB)' },
  { id: 'avalanche-2', name: 'Avalanche (AVAX)' },
  { id: 'uniswap', name: 'Uniswap (UNI)' },
  { id: 'chainlink', name: 'Chainlink (LINK)' },
  { id: 'stellar', name: 'Stellar (XLM)' },
  { id: 'monero', name: 'Monero (XMR)' }
];

function TokenPairAnalysis() {
  const [token1, setToken1] = useState('bitcoin');
  const [token2, setToken2] = useState('ethereum');
  const [days, setDays] = useState(30);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null);
  const [token1Suggestions, setToken1Suggestions] = useState([]);
  const [token2Suggestions, setToken2Suggestions] = useState([]);
  const [showToken1Suggestions, setShowToken1Suggestions] = useState(false);
  const [showToken2Suggestions, setShowToken2Suggestions] = useState(false);

  // Filter token suggestions based on input
  const filterSuggestions = (input) => {
    if (!input || input.trim() === '') {
      // Return common tokens if input is empty
      return COMMON_TOKENS.slice(0, 5);
    }
    
    const lowerInput = input.toLowerCase().trim();
    return COMMON_TOKENS.filter(token => 
      token.id.toLowerCase().includes(lowerInput) || 
      token.name.toLowerCase().includes(lowerInput)
    ).slice(0, 5); // Limit to 5 suggestions
  };

  // Handle token1 input change
  const handleToken1Change = (e) => {
    const value = e.target.value;
    setToken1(value);
    const filtered = filterSuggestions(value);
    setToken1Suggestions(filtered);
    setShowToken1Suggestions(true);
  };

  // Handle token2 input change
  const handleToken2Change = (e) => {
    const value = e.target.value;
    setToken2(value);
    const filtered = filterSuggestions(value);
    setToken2Suggestions(filtered);
    setShowToken2Suggestions(true);
  };

  // Select token from suggestions
  const selectToken1 = (token) => {
    setToken1(token.id);
    setShowToken1Suggestions(false);
  };

  // Select token from suggestions
  const selectToken2 = (token) => {
    setToken2(token.id);
    setShowToken2Suggestions(false);
  };

  const analyzeCorrelation = async () => {
    setLoading(true);
    setError('');
    setCorrelation(null);
    
    try {

      const response = await axios.get('http://localhost:8000/api/correlation', {
        params: { token1, token2, days }
      });
      
      setCorrelation(response.data.correlation);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check if the server is running.');
      } else {
        setError('Error fetching correlation data. Please check token names and try again.');
      }
      
      console.error('Error details:', err);
    }
  };

  const getCorrelationColor = () => {
    if (correlation === null) return 'black';
    if (correlation > 0.7) return 'green';
    if (correlation > 0.3) return 'lightgreen';
    if (correlation > -0.3) return 'gray';
    if (correlation > -0.7) return 'orange';
    return 'red';
  };

  const getCorrelationText = () => {
    if (correlation === null) return '';
    if (correlation > 0.7) return 'Strong Positive';
    if (correlation > 0.3) return 'Moderate Positive';
    if (correlation > -0.3) return 'Weak/No Correlation';
    if (correlation > -0.7) return 'Moderate Negative';
    return 'Strong Negative';
  };

  // Close suggestion dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close suggestions if clicking inside the search inputs
      if (!event.target.closest('.suggestion-container')) {
        setShowToken1Suggestions(false);
        setShowToken2Suggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="content">
      <div className="container">
        <h2>Token Pair Correlation</h2>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          analyzeCorrelation();
        }}>
          <div className="form-group">
            <label>First Token:</label>
            <div className="suggestion-container">
              <input 
                type="text" 
                value={token1} 
                onChange={handleToken1Change} 
                placeholder="e.g., bitcoin"
                onClick={(e) => {
                  e.stopPropagation();
                  const filtered = filterSuggestions(token1);
                  setToken1Suggestions(filtered);
                  setShowToken1Suggestions(true);
                }}
              />
              {showToken1Suggestions && (
                <ul className="suggestions">
                  {token1Suggestions.length > 0 ? (
                    token1Suggestions.map(token => (
                      <li 
                        key={token.id} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectToken1(token);
                        }}
                      >
                        {token.name}
                      </li>
                    ))
                  ) : (
                    <li className="no-results">No tokens found</li>
                  )}
                </ul>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>Second Token:</label>
            <div className="suggestion-container">
              <input 
                type="text" 
                value={token2} 
                onChange={handleToken2Change} 
                placeholder="e.g., ethereum"
                onClick={(e) => {
                  e.stopPropagation();
                  const filtered = filterSuggestions(token2);
                  setToken2Suggestions(filtered);
                  setShowToken2Suggestions(true);
                }}
              />
              {showToken2Suggestions && (
                <ul className="suggestions">
                  {token2Suggestions.length > 0 ? (
                    token2Suggestions.map(token => (
                      <li 
                        key={token.id} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectToken2(token);
                        }}
                      >
                        {token.name}
                      </li>
                    ))
                  ) : (
                    <li className="no-results">No tokens found</li>
                  )}
                </ul>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>Time Period (days):</label>
            <select value={days} onChange={(e) => setDays(e.target.value)}>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
          
          <button 
            type="submit"
            disabled={loading || !token1 || !token2}
          >
            {loading ? 'Analyzing...' : 'Analyze Correlation'}
          </button>
        </form>
        
        {error && <div className="error">{error}</div>}
        
        {correlation !== null && (
          <div className="results">
            <h2>Correlation Results</h2>
            <div className="correlation">
              <div className="correlation-value" style={{ color: getCorrelationColor() }}>
                {correlation.toFixed(4)}
              </div>
              <div className="correlation-label">
                {getCorrelationText()}
              </div>
            </div>
            
            <div className="explanation">
              <p>
                A correlation of 1 means the tokens move exactly together, 
                -1 means they move in opposite directions, and 0 means no relationship.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TokenPairAnalysis; 