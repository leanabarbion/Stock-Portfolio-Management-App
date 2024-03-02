import React, { useState, useEffect } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";

function StockSymbols() {
  const [symbols, setSymbols] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:5000/symbols")
      .then((response) => response.json())
      .then((data) => setSymbols(data.symbols))
      .catch((error) => console.error("Error fetching symbols:", error));
  }, []);

  const addToPortfolio = (symbol) => {
    if (!portfolio.includes(symbol)) {
      setPortfolio((prevPortfolio) => [...prevPortfolio, symbol]);
    }
  };

  const handleGoToPortfolio = () => {
    navigate("/portfolio", { state: { portfolio } });
  };

  return (
    <div>
      <h1>Stock Symbols</h1>
      <ListGroup>
        {symbols.map((symbol, index) => (
          <ListGroup.Item
            key={index}
            className="d-flex justify-content-between align-items-center"
          >
            {symbol}
            <Button variant="primary" onClick={() => addToPortfolio(symbol)}>
              Add to Portfolio
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button
        variant="info"
        style={{ position: "fixed", top: "20px", right: "20px" }}
        onClick={handleGoToPortfolio}
      >
        My Portfolio
      </Button>
    </div>
  );
}

export default StockSymbols;
