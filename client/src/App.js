import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import TokenPairAnalysis from './pages/TokenPairAnalysis';
import BasketAnalysis from './pages/BasketAnalysis';
import './App.css';

// NavLink component that adds 'active' class to current route
const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </Link>
  );
};

// Main Navigation component
const Navigation = () => {
  return (
    <header className="App-header">
      <div className="header-content">
        <h1>Crypto Correlation</h1>
        <nav className="main-nav">
          <NavLink to="/">
            Token Pair Analysis
          </NavLink>
          <NavLink to="/basket-analysis">
            Basket Analysis
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              <Navigation />
              <TokenPairAnalysis />
            </>
          } />
          <Route path="/basket-analysis" element={
            <>
              <Navigation />
              <BasketAnalysis />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
