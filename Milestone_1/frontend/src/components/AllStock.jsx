import React, { useState, useEffect } from "react";
import SymbolData from "./StockDetails";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Form, ListGroup, InputGroup } from "react-bootstrap";

function StockList() {
  const [stocks, setStocks] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [investmentAmounts, setInvestmentAmounts] = useState("");
  const [portfolio, setPortfolio] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [portfolioDetails, setPortfolioDetails] = useState({});

  const fetchStocks = () => {
    fetch("http://127.0.0.1:5000/api/stocks")
      .then((response) => response.json())
      .then((data) => setStocks(data))
      .catch((error) => console.error("Failed to fetch stocks:", error));
  };

  // Fetch stocks on component mount
  useEffect(() => {
    fetchStocks();
  }, []);

  // Function to add a new stock
  const addStock = (e) => {
    e.preventDefault();
    fetch("http://127.0.0.1:5000/api/add-stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol, name }),
    })
      .then((response) => {
        if (response.ok) {
          fetchStocks(); // Refresh the list of stocks
          setSymbol("");
          setName("");
        } else {
          alert("Failed to add stock");
        }
      })
      .catch((error) => console.error("Failed to add stock:", error));
  };

  const deleteStock = (symbolToDelete) => {
    fetch("http://127.0.0.1:5000/api/delete-stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol: symbolToDelete }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
          fetchStocks(); // Refresh the list of stocks after deletion
        } else {
          alert(data.error);
        }
      })
      .catch((error) => {
        console.error("Failed to delete stock:", error);
        alert("An error occurred while deleting the stock.");
      });
  };
  const handleSymbolSelect = (symbol) => {
    setSelectedSymbol(symbol); // Update the selectedSymbol state when a symbol is clicked
  };

  const fetchCurrentPrice = (symbol) => {
    // Assuming you have an API that returns the current price for a given symbol
    // Replace the URL with your actual API endpoint
    fetch(`http://127.0.0.1:5000/api/stock-details?symbol=${symbol}`)
      .then((response) => response.json())
      .then((data) => {
        const currentPrice = data.currentPrice || "N/A";
        setPortfolioDetails((prevDetails) => ({
          ...prevDetails,
          [symbol]: { ...prevDetails[symbol], currentPrice },
        }));
      })
      .catch((error) =>
        console.error("Error fetching current price for symbol:", symbol, error)
      );
  };

  const handleInvestmentChange = (symbol, amount) => {
    setInvestmentAmounts({
      ...investmentAmounts,
      [symbol]: amount,
    });
  };

  const calculatePortfolioValue = () => {
    return Object.keys(investmentAmounts).reduce((total, symbol) => {
      const amountInvested = parseFloat(investmentAmounts[symbol]) || 0;
      const currentPrice =
        parseFloat(portfolioDetails[symbol]?.currentPrice) || 0;
      return total + amountInvested * currentPrice;
    }, 0);
  };

  return (
    <div>
      <h2>Stock List</h2>
      <ListGroup>
        {stocks.map((stock, index) => (
          <ListGroup.Item
            key={index}
            className="d-flex justify-content-between align-items-center"
          >
            {stock.symbol} - {stock.name}
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSymbolSelect(stock.symbol)}
            >
              View Details
            </Button>{" "}
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteStock(stock.symbol)}
            >
              Delete
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      {selectedSymbol && <SymbolData symbol={selectedSymbol} />}
      <h3>Add a new stock</h3>
      <Form onSubmit={addStock}>
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Symbol"
            required
          />
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
          <Button variant="success" type="submit">
            Add Stock
          </Button>
        </InputGroup>
      </Form>
    </div>
  );
}

export default StockList;
