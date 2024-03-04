import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Card, Button } from "react-bootstrap";

function StockPortfolio({ symbols }) {
  const [portfolioData, setPortfolioData] = useState([]);
  const [investmentAmounts, setInvestmentAmounts] = useState({});
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (symbols.length > 0) {
      const queryString = symbols.join(",");
      axios
        .get(`http://127.0.0.1:5000/portfolio?symbols=${queryString}`)
        .then((response) => {
          setPortfolioData(response.data);
          let initialInvestments = {};
          response.data.forEach((stock) => {
            initialInvestments[stock.ticker] = "";
          });
          setInvestmentAmounts(initialInvestments);
        })
        .catch((error) => {
          console.error("Error fetching stock data:", error);
        });
    }
  }, [symbols]);

  const handleInvestmentChange = (ticker, amount) => {
    setInvestmentAmounts((prev) => ({ ...prev, [ticker]: amount }));
  };

  // Calculate the total portfolio's value
  const totalPortfolioValue = portfolioData.reduce((acc, stock) => {
    const investment = investmentAmounts[stock.ticker];
    const currentPrice = parseFloat(stock.current);
    if (!isNaN(investment) && !isNaN(currentPrice)) {
      return acc + investment * currentPrice;
    }
    return acc;
  }, 0);

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "row", // Align buttons in a row
          gap: "10px", // Add space between buttons
        }}
      >
        <Button variant="secondary" onClick={() => navigate("/")}>
          Home
        </Button>
      </div>
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
              <input
                type="number"
                placeholder="Investment Amount ($)"
                value={investmentAmounts[stock.ticker]}
                onChange={(e) =>
                  handleInvestmentChange(stock.ticker, e.target.value)
                }
              />
            </>
          )}
        </div>
      ))}
      <div>
        <h2>Total Portfolio Value: ${totalPortfolioValue.toFixed(2)}</h2>
      </div>
    </div>
  );
}

export default StockPortfolio;
