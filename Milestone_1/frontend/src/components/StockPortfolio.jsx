import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

function StockPortfolio({ symbols }) {
  const [portfolioData, setPortfolioData] = useState([]);
  // A comma-separated list of stock symbols
  //const symbols = "AAPL,MSFT,GOOGL";

  useEffect(() => {
    if (symbols.length > 0) {
      const queryString = symbols.join(",");
      axios
        .get(`http://127.0.0.1:5000/portfolio?symbols=${queryString}`)
        .then((response) => setPortfolioData(response.data))
        .catch((error) => console.error("Error fetching stock data:", error));
    }
  }, [symbols]);

  return (
    <div>
      <h1>Portfolio</h1>
      {portfolioData.map((stock, index) => (
        <div key={index}>
          <h2>{stock.ticker}</h2>
          {stock.error ? (
            <p>Error: {stock.error}</p>
          ) : (
            <>
              <p>High: {stock.high}</p>
              <p>Current: {stock.current}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default StockPortfolio;
