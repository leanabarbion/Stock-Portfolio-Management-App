import React, { useState, useEffect } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router-dom";

function StockSymbols({ onAddToPortfolio }) {
  const [symbols, setSymbols] = useState([]);
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/symbols")
      .then((response) => response.json())
      .then((data) => setSymbols(data.symbols))
      .catch((error) => console.error("Error fetching symbols:", error));
  }, []);

  // Adjusted addToPortfolio to navigate
  const addToPortfolioAndNavigate = (symbol) => {
    onAddToPortfolio(symbol); // Use the prop to add symbol to portfolio
    navigate("/portfolio"); // Navigate to portfolio page
  };

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  return (
    <div>
      <h1>Welcome to WealthWise</h1>
      <ListGroup>
        {symbols.map((symbol, index) => (
          <ListGroup.Item
            key={index}
            className="d-flex justify-content-between align-items-center"
          >
            {symbol}
            <Button variant="primary" onClick={() => onAddToPortfolio(symbol)}>
              Add to Portfolio
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      {/* Moved "Go to My Portfolio" Button below the ListGroup */}
      <div style={{ marginTop: "20px" }}>
        <Button
          variant="info"
          style={{ position: "fixed", top: "20px", right: "20px" }}
          onClick={() => navigate("/portfolio")}
        >
          My Portfolio
        </Button>
      </div>

      {/* Portfolio Modal */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>My Portfolio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>
            {portfolio.length > 0 ? (
              portfolio.map((symbol, index) => (
                <ListGroup.Item key={index}>{symbol}</ListGroup.Item>
              ))
            ) : (
              <p>Your portfolio is empty.</p>
            )}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default StockSymbols;
