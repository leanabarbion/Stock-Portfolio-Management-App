import React from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { useLocation } from "react-router-dom";

function StockPortfolio() {
  const location = useLocation();
  const { portfolio } = location.state || { portfolio: [] };

  return (
    <div>
      <h1>My Portfolio</h1>
      <ListGroup>
        {portfolio.length > 0 ? (
          portfolio.map((symbol, index) => (
            <ListGroup.Item key={index}>{symbol}</ListGroup.Item>
          ))
        ) : (
          <p>Your portfolio is empty.</p>
        )}
      </ListGroup>
    </div>
  );
}

export default StockPortfolio;
