import React, { useState, useEffect } from "react";
import SymbolData from "./StockDetails";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Form, ListGroup, InputGroup, Row, Col } from "react-bootstrap";

function StockList() {
  const [stocks, setStocks] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [quantities, setQuantities] = useState(
    JSON.parse(localStorage.getItem("quantities")) || {}
  );

  const fetchStocks = () => {
    fetch("http://127.0.0.1:5000/api/all-stocks")
      .then((response) => response.json())
      .then((data) => setStocks(data))
      .catch((error) => console.error("Failed to fetch stocks:", error));
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleQuantityChange = (symbol, quantity) => {
    const newQuantities = {
      ...quantities,
      [symbol]: parseFloat(quantity) || 0,
    };
    setQuantities(newQuantities);
    localStorage.setItem("quantities", JSON.stringify(newQuantities));
  };

  // Directly calculate total portfolio value in the render method
  const calculateTotalPortfolioValue = () => {
    return stocks
      .reduce((total, stock) => {
        const quantity = quantities[stock.symbol] || 0;
        return total + stock.price * quantity;
      }, 0)
      .toFixed(2);
  };

  // Function to add a new stock
  const addStock = (e) => {
    e.preventDefault();
    fetch("http://127.0.0.1:5000/api/api/portfolio/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol, name }),
    })
      .then((response) => response.json()) // Convert the response to JSON
      .then((data) => {
        if (data.message) {
          alert(data.message); // Display the success message
          fetchStocks(); // Refresh the list of stocks
          setSymbol("");
          setName("");
        } else {
          alert("Failed to add stock"); // This case may need to be adjusted based on your API response for errors
        }
      })
      .catch((error) => {
        console.error("Failed to add stock:", error);
        alert("An error occurred while adding the stock."); // Displaying a generic error message
      });
  };

  const deleteStock = (symbolToDelete) => {
    fetch("http://127.0.0.1:5000/api/portfolio/remove", {
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

  return (
    <Row>
      <Col xs={12} md={5}>
        {" "}
        {/* Adjust sizes as needed */}
        <div>
          <h2>Stock List</h2>
          <ListGroup>
            {stocks.map((stock, index) => (
              <ListGroup.Item
                key={index}
                className="d-flex align-items-center"
                style={{ justifyContent: "space-between" }}
              >
                <div style={{ flex: 1 }}>
                  {stock.symbol} - {stock.name}
                </div>
                <div
                  className="ml-auto"
                  style={{ display: "flex", gap: "10px" }}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSymbolSelect(stock.symbol)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteStock(stock.symbol)}
                  >
                    Delete
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
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
        <h2>Portfolio</h2>
        <strong>
          Total Portfolio Value: ${calculateTotalPortfolioValue()}
        </strong>
        <ListGroup>
          {stocks.map((stock, index) => (
            <ListGroup.Item key={index}>
              <Row className="align-items-center">
                <Col xs={3} className="mr-2">
                  {stock.symbol}
                </Col>
                <Col xs={3} className="mr-2">
                  ${stock.price}
                </Col>
                <Col xs={3}>
                  <InputGroup
                    size="sm"
                    className="d-flex"
                    style={{ width: "auto" }}
                  >
                    <Form.Control
                      type="number"
                      value={quantities[stock.symbol] || ""}
                      onChange={(e) =>
                        handleQuantityChange(
                          stock.symbol,
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="Quantity"
                      min="0"
                      style={{ width: "50px" }}
                    />
                  </InputGroup>
                </Col>
                <Col xs={3}>
                  Total: ${(quantities[stock.symbol] || 0) * stock.price}
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <div className="mt-3"></div>
      </Col>
      <Col xs={12} md={7}>
        {" "}
        {/* Adjust sizes as needed */}
        {selectedSymbol && <SymbolData symbol={selectedSymbol} />}
      </Col>
    </Row>
  );
}

export default StockList;
