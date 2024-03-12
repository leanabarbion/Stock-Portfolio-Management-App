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
import SymbolData from "./StockDetails"; // Adjust the import path as necessary

function StockSymbols() {
  const [symbols, setSymbols] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioDetails, setPortfolioDetails] = useState({});
  const [investmentAmounts, setInvestmentAmounts] = useState({});
  const [investmentInput, setInvestmentInput] = useState({});
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertSymbol, setAlertSymbol] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch(` http://127.0.0.1:5000/api/all-stocks`)
      .then((response) => response.text()) // Fetch as text, not JSON
      .then((csvText) => {
        // Assuming your CSV has a header and the first column is 'symbol'
        const rows = csvText.split("\n"); // Split by new line to get rows
        const fetchedSymbols = rows
          .slice(1)
          .map((row) => row.split(",")[0])
          .filter(Boolean);
        setSymbols(fetchedSymbols);
      })
      .catch((error) => console.error("Error fetching symbols:", error));
  }, []);

  useEffect(() => {
    if (loggedIn) {
      // Assume you have a state or context tracking login status
      fetch(` http://127.0.0.1:5000/api/portfolio`, {
        credentials: "include", // Needed for sessions to work
      })
        .then((response) => response.json())
        .then((data) => {
          setPortfolio(data); // Assuming the response is an array of portfolio items
          // You might need to adjust based on how your data is structured
        })
        .catch((error) => console.error("Error fetching portfolio:", error));
    }
  }, [loggedIn]);
  useEffect(() => {
    console.log(portfolioDetails); // Log to see if details are updated after fetching
  }, [portfolioDetails]);

  const fetchCurrentPrice = (symbol) => {
    fetch(` http://127.0.0.1:5000/api/stock/?symbol=${symbol}`)
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
    const investmentAmount = parseFloat(investmentInput); // Convert input to a number
    fetchCurrentPrice(symbol);
    // Validate the input as needed (e.g., ensure it's a positive number)

    fetch(` http://127.0.0.1:5000/api/portfolio/add`, {
      method: "POST",
      credentials: "include", // Needed for sessions to work
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol: symbol,
        investment_amount: investmentAmount,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle response
        setShowAlert(true);
        setAlertSymbol(symbol); // Show which symbol was added
        setTimeout(() => setShowAlert(false), 3000);
        // Clear the input field
        setInvestmentInput("");
        // Optionally, fetch the updated portfolio again to reflect changes
      })
      .catch((error) => console.error("Error adding to portfolio:", error));
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
