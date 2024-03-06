import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container } from 'react-bootstrap';
import StockSymbols from "./components/AllStock";
import SymbolData from './components/StockDetails';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  const handleSelectSymbol = (symbol) => {
    setSelectedSymbol(symbol);
  };

  return (
    <Container className="mt-3">
      <h1 className="text-center mb-3">WealthWise: Stock Management App</h1>
      <StockSymbols onSelectSymbol={handleSelectSymbol} />
      {selectedSymbol && <SymbolData symbol={selectedSymbol} />}
    </Container>
  );
}

export default App;
