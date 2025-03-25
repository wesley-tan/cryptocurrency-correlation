import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BasketAnalysis.css';

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

function BasketAnalysis() {
  // State for basket management
  const [basket1, setBasket1] = useState([]);
  const [basket2, setBasket2] = useState([]);
  const [days, setDays] = useState(30);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for token search and selection
  const [tokenSearchTerm, setTokenSearchTerm] = useState('');
  const [tokenSuggestions, setTokenSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeBasket, setActiveBasket] = useState(null); // 1 or 2
  
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
  
  // Handle token search input change
  const handleTokenSearchChange = (e) => {
    const value = e.target.value;
    setTokenSearchTerm(value);
    const filtered = filterSuggestions(value);
    console.log('Search term:', value);
    console.log('Filtered suggestions:', filtered);
    
    setTokenSuggestions(filtered);
    setShowSuggestions(true);
  };
  
  // Add a token to the specified basket
  const addToBasket = (basketNumber, token) => {
    console.log(`Adding ${token.name} to basket ${basketNumber}`);
    
    if (basketNumber === 1) {
      if (!basket1.some(item => item.id === token.id)) {
        setBasket1([...basket1, token]);
      }
    } else {
      if (!basket2.some(item => item.id === token.id)) {
        setBasket2([...basket2, token]);
      }
    }
    
    // Reset search state after adding
    setTokenSearchTerm('');
    setShowSuggestions(false);
    setActiveBasket(null); // Close the modal
  };
  
  // Remove a token from the specified basket
  const removeFromBasket = (basketNumber, tokenId) => {
    if (basketNumber === 1) {
      setBasket1(basket1.filter(token => token.id !== tokenId));
    } else {
      setBasket2(basket2.filter(token => token.id !== tokenId));
    }
  };
  
  // Analyze correlation between the two baskets
  const analyzeBasketCorrelation = async () => {
    if (basket1.length === 0 || basket2.length === 0) {
      setError('Both baskets must contain at least one token');
      return;
    }
    
    setLoading(true);
    setError('');
    setCorrelation(null);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/basket-correlation`, {
        basket1: basket1.map(token => token.id),
        basket2: basket2.map(token => token.id),
        days
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
  
  // Check if clicked element is inside the suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close suggestions if clicking inside the token search
      if (event.target.closest('.token-search')) {
        return;
      }
      setShowSuggestions(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="content">
      <div className="container">
        <h2>Basket Correlation Analysis</h2>
        
        <div className="baskets-container">
          <div className="basket-column">
            <h3>Basket 1</h3>
            <div className="basket">
              {basket1.map(token => (
                <div className="basket-token" key={token.id}>
                  <span>{token.name}</span>
                  <button 
                    className="remove-token"
                    onClick={() => removeFromBasket(1, token.id)}
                  > × </button>
                </div>
              ))}
              <button 
                className="add-token-btn"
                onClick={() => {
                  setActiveBasket(1);
                  setTokenSearchTerm('');
                  setTokenSuggestions([]);
                }}
              >
                + Add Token
              </button>
            </div>
          </div>
          
          <div className="basket-column">
            <h3>Basket 2</h3>
            <div className="basket">
              {basket2.map(token => (
                <div className="basket-token" key={token.id}>
                  <span>{token.name}</span>
                  <button 
                    className="remove-token"
                    onClick={() => removeFromBasket(2, token.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                className="add-token-btn"
                onClick={() => {
                  setActiveBasket(2);
                  setTokenSearchTerm('');
                  setTokenSuggestions([]);
                }}
              >
                + Add Token
              </button>
            </div>
          </div>
        </div>
        
        {activeBasket && (
          <div className="token-search-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Add Token to Basket {activeBasket}</h3>
                <button 
                  className="close-modal"
                  onClick={() => setActiveBasket(null)}
                >
                  ×
                </button>
              </div>
              <div className="token-search">
                <input
                  type="text"
                  value={tokenSearchTerm}
                  onChange={handleTokenSearchChange}
                  placeholder="Search for tokens..."
                  onClick={(e) => {
                    e.stopPropagation();
                    // Always show suggestions on click regardless of current state
                    const filteredTokens = filterSuggestions(tokenSearchTerm || '');
                    setTokenSuggestions(filteredTokens);
                    setShowSuggestions(true);
                  }}
                  autoFocus
                />
                <ul className="suggestions">
                  {tokenSuggestions.length > 0 ? (
                    tokenSuggestions.map(token => (
                      <li 
                        key={token.id} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToBasket(activeBasket, token);
                        }}
                      >
                        {token.name}
                      </li>
                    ))
                  ) : (
                    <li className="no-results">No tokens found</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className="controls">
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
            className="analyze-button"
            onClick={analyzeBasketCorrelation}
            disabled={loading || basket1.length === 0 || basket2.length === 0}
          >
            {loading ? 'Analyzing...' : 'Analyze Basket Correlation'}
          </button>

          {error && <div className="error">{error}</div>}
        </div>
        
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
            
            <div className="basket-details">
              <div className="basket-info">
                <h3>Basket 1</h3>
                <ul>
                  {basket1.map(token => (
                    <li key={token.id}>{token.name}</li>
                  ))}
                </ul>
              </div>
              <div className="basket-info">
                <h3>Basket 2</h3>
                <ul>
                  {basket2.map(token => (
                    <li key={token.id}>{token.name}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="explanation">
              <p>
                A correlation of 1 means the baskets move exactly together, 
                -1 means they move in opposite directions, and 0 means no relationship.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BasketAnalysis; 