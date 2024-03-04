import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StockPortfolio from "./components/StockPortfolio";
import StockSymbols from "./components/StockSymbols";
import SymbolData from "./components/StockData";
import 'bootstrap/dist/css/bootstrap.min.css';

function App (){
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const handleAddToPortfolio = (symbol) => {
    setSelectedSymbols(prevSymbols => {
      // Add the symbol if it's not already in the array
      if (!prevSymbols.includes(symbol)) {
        return [...prevSymbols, symbol];
      }
      return prevSymbols;
    });
  };
  return (
  <Router>
    <Routes>
      <Route path="/" element={<StockSymbols onAddToPortfolio={handleAddToPortfolio}/>} />
      <Route path="/portfolio" element={<StockPortfolio symbols={selectedSymbols}/>} />
      <Route path="/symbol/:symbol" element={<SymbolData />} /> {/* New route */}
    </Routes>
  </Router>
  );

}
export default App;