import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Button,
  Alert,
  Card,
  Form,
} from "react-bootstrap";
import SymbolData from "./StockData"; // Adjust the import path as necessary

function StockSymbols() {
  const [symbols, setSymbols] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioDetails, setPortfolioDetails] = useState({});
  const [investmentAmounts, setInvestmentAmounts] = useState({});
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertSymbol, setAlertSymbol] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/symbols`)
      .then((response) => response.json())
      .then((data) => setSymbols(data.symbols))
      .catch((error) => console.error("Error fetching symbols:", error));
  }, []);

  const fetchCurrentPrice = (symbol) => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/data?symbol=${symbol}`)
      .then((response) => response.json())
      .then((data) => {
        const latestData = data.trend_data[data.trend_data.length - 1] || {};
        const currentPrice = latestData.close || "N/A";
        setPortfolioDetails((prevDetails) => ({
          ...prevDetails,
          [symbol]: { ...latestData, currentPrice },
        }));
      })
      .catch((error) =>
        console.error("Error fetching data for symbol:", symbol, error)
      );
  };

  const addToPortfolio = (symbol) => {
    if (!portfolio.includes(symbol)) {
      setPortfolio([...portfolio, symbol]);
      fetchCurrentPrice(symbol);
      setAlertSymbol(symbol);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // Fetch and store the current price
    }
  };

  const handleInvestmentChange = (symbol, amount) => {
    setInvestmentAmounts({ ...investmentAmounts, [symbol]: amount });
  };

  const viewSymbolData = (symbol) => {
    setSelectedSymbol(symbol); // Assuming you have local state or method to handle UI changes
    // Use the passed function to set the selected symbol in App component
  };

  const calculatePortfolioValue = () => {
    return portfolio.reduce((total, symbol) => {
      const amountInvested = parseFloat(investmentAmounts[symbol]) || 0;
      const stockDetails = portfolioDetails[symbol] || {};
      const currentPrice = parseFloat(stockDetails.currentPrice) || 0;
      return total + amountInvested * currentPrice;
    }, 0);
  };

  const totalPortfolioValue = calculatePortfolioValue(); // Just return the totalValue if you're calculating total portfolio value

  return (
    <Container fluid>
      <Row>
        <Col md={4} className="border-right">
          <h2>Stock Symbols</h2>
          {showAlert && (
            <Alert variant="success">{`${alertSymbol} has been added to your portfolio.`}</Alert>
          )}
          <Form.Control
            type="text"
            placeholder="Search for a stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ListGroup className="mt-3">
            {symbols
              .filter((symbol) =>
                symbol.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((symbol, index) => (
                <ListGroup.Item
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                >
                  {symbol}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => addToPortfolio(symbol)}
                  >
                    Add to Portfolio
                  </Button>
                </ListGroup.Item>
              ))}
          </ListGroup>
        </Col>
        <Col md={8}>
          <Button
            variant="info"
            onClick={() => setShowPortfolio(!showPortfolio)}
            className="mb-3"
          >
            Portfolio View
          </Button>
          {showPortfolio && (
            <>
              <ListGroup>
                {portfolio.map((symbol, index) => (
                  <ListGroup.Item
                    key={index}
                    className="d-flex justify-content-between align-items-center"
                  >
                    {symbol}
                    <div className="d-flex align-items-center">
                      <Form.Control
                        type="number"
                        placeholder="Investment Amount ($)"
                        value={investmentAmounts[symbol] || ""}
                        onChange={(e) =>
                          handleInvestmentChange(symbol, e.target.value)
                        }
                        style={{ marginRight: "10px", width: "150px" }}
                      />
                      Current Price: $
                      {parseFloat(
                        portfolioDetails[symbol]?.currentPrice
                      ).toFixed(2) || "N/A"}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setSelectedSymbol(symbol)}
                      >
                        View Data
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Card className="mt-3">
                <Card.Body>
                  <Card.Title>Total Portfolio Value</Card.Title>
                  <Card.Text>${calculatePortfolioValue().toFixed(2)}</Card.Text>
                </Card.Body>
              </Card>
              {selectedSymbol && <SymbolData symbol={selectedSymbol} />}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default StockSymbols;
