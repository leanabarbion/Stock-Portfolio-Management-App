import React from 'react';
import StockInfo from './components/StockPortfolio';// Assuming StockInfo is in the same directory

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>React Stock Portfolio</h1>
      </header>
      <main>
        <StockInfo />
      </main>
    </div>
  );
}

export default App;
