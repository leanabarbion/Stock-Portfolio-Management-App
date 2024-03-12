import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container } from 'react-bootstrap';
import StockSymbols from "./components/AllStock";
import SymbolData from './components/StockDetails';
import AuthView from './components/AuthView';
import NavBar from './components/Logout'

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch(` http://127.0.0.1:5000/api/is-logged-in`)
      .then(response => response.json())
      .then(data => setIsLoggedIn(data.logged_in))
      .catch(error => console.error("Error checking login status:", error));
  }, []);

  const handleSelectSymbol = (symbol) => {
    setSelectedSymbol(symbol);
  };

  const handleLogout = () => {
    fetch(` http://127.0.0.1:5000/logout`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setIsLoggedIn(false);
          setSelectedSymbol(null); // Optionally reset the selected symbol
        }
      })
      .catch(error => console.error("Error logging out:", error));
  };

  return (
    <Container className="mt-3">
      <h1 className="text-center mb-3">WealthWise: Stock Management App</h1>
      {!isLoggedIn ? (
        <AuthView onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <>
        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
          <StockSymbols onSelectSymbol={handleSelectSymbol} />
          {selectedSymbol && <SymbolData symbol={selectedSymbol} />}
        </>
      )}
    </Container>
  );
}

export default App;