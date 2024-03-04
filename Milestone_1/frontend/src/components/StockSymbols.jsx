import React, { useState, useEffect } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { Button, Modal, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function StockSymbols({ onAddToPortfolio }) {
  const [symbols, setSymbols] = useState([]);
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAlert, setShowAlert] = useState(false); // State to control alert visibility
  const [alertMessage, setAlertMessage] = useState(""); // State to set alert message

  useEffect(() => {
    fetch("http://127.0.0.1:5000/symbols")
      .then((response) => response.json())
      .then((data) => setSymbols(data.symbols))
      .catch((error) => console.error("Error fetching symbols:", error));
  }, []);

  // Adjusted addToPortfolio to navigate
  const addToPortfolioAndShowAlert = (symbol) => {
    onAddToPortfolio(symbol); // Use the prop to add symbol to portfolio
    setAlertMessage(`"${symbol}" added to portfolio!`); // Set the message
    setShowAlert(true); // Show the alert
    setTimeout(() => setShowAlert(false), 3000);
    // navigate("/portfolio"); // Navigate to portfolio page
  };
  const filteredSymbols = symbols.filter((symbol) =>
    symbol.toUpperCase().includes(searchQuery.toUpperCase())
  );
  useEffect(() => {
    console.log(searchQuery); // See the current search query
  }, [searchQuery]);

  useEffect(() => {
    console.log(filteredSymbols); // See the current filtered symbols
  }, [filteredSymbols]);
  const viewData = (symbol) => {
    navigate(`/symbol/${symbol}`); // Navigate to symbol-specific page
  };

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  return (
    <div>
      <h1>Welcome to WealthWise</h1>
      {showAlert && <Alert variant="success">{alertMessage}</Alert>}
      <input
        type="text"
        placeholder="Search for a symbol..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          marginBottom: "20px",
          padding: "10px",
          width: "calc(100% - 20px)",
        }}
      />

      {/* "Go to My Portfolio" Button */}
      <Button
        variant="info"
        style={{ position: "fixed", top: "20px", right: "20px" }}
        onClick={() => navigate("/portfolio")}
      >
        My Portfolio
      </Button>
      <ListGroup
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {filteredSymbols.map((symbol, index) => (
          <React.Fragment key={index}>
            <div className="symbol">{symbol}</div>
            <Button
              variant="primary"
              onClick={() => addToPortfolioAndShowAlert(symbol)}
            >
              Add to Portfolio
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/symbol/${symbol}`)}
            >
              View Data
            </Button>
          </React.Fragment>
        ))}
      </ListGroup>

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
