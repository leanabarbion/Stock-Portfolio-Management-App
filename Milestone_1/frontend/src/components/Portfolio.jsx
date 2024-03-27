import React, { useState, useEffect } from "react";

function Portfolio({ isLoggedIn }) {
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      console.log("isLoggedIn state in useEffect:", isLoggedIn); // Debugging
      if (!isLoggedIn) {
        console.log("Not logged in. Skipping portfolio fetch.");
        return; // Early return if not logged in
      }

      try {
        console.log("Fetching portfolio data..."); // Debugging
        const response = await fetch(
          "http://127.0.0.1:5000/api/user/portfolio",
          {
            credentials: "include", // for cookies to be sent
          }
        );
        if (!response.ok) throw new Error("Failed to fetch portfolio");
        const data = await response.json();
        console.log("Portfolio data fetched:", data); // Debugging
        setPortfolio(data); // Set the portfolio data to state
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      }
    };

    fetchPortfolio();
  }, [isLoggedIn]);

  return (
    <div>
      <h2>My Portfolio</h2>
      <ul>
        {portfolio.map((stock, index) => (
          <li key={index}>
            Symbol: {stock.symbol}, Name: {stock.name}, Quantity:{" "}
            {stock.quantity}, Acquisition Price: {stock.acquisition_price},
            Acquisition Date: {stock.acquisition_date}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Portfolio;
