import React, { useState, useEffect } from "react";

function StockInfo() {
  const [stockData, setStockData] = useState([]);
  const symbols = "IBM"; // Example symbols

  useEffect(() => {
    const fetchStockData = async () => {
      const response = await fetch(
        `http://127.0.0.1:5000/list-portfolio?symbols=${symbols}`
      );
      const data = await response.json();
      setStockData(data);
    };

    fetchStockData().catch(console.error);
  }, [symbols]);

  return (
    <div>
      <h1>Stock Information</h1>
      {stockData.map((stock, index) => (
        <div key={index}>
          <h2>{stock.ticker}</h2>
          <p>High: {stock.high}</p>
          <p>Current: {stock.current}</p>
          {stock.error && <p>Error: {stock.error}</p>}
        </div>
      ))}
    </div>
  );
}

export default StockInfo;
