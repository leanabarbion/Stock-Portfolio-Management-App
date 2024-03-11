import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "react-bootstrap";

function SymbolData({ symbol }) {
  // Make sure to receive the symbol as a prop
  const [trendData, setTrendData] = useState([]);
  const [latestData, setLatestData] = useState({});

  useEffect(() => {
    // Ensure that the symbol is not null or undefined
    if (symbol) {
      const url = ` http://127.0.0.1:5000/api/stock/?symbol=${symbol}`;
      axios
        .get(url)
        .then((response) => {
          setTrendData(response.data.trend_data);
          if (response.data.trend_data.length > 0) {
            setLatestData(
              response.data.trend_data[response.data.trend_data.length - 1]
            );
          }
        })
        .catch((error) => {
          console.error("Error fetching trend data for symbol:", symbol, error);
        });
    }
  }, [symbol]); // Depend on the symbol prop to re-fetch data when it changes

  return (
    <div
      style={{
        marginTop: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Conditional rendering based on whether symbol is set */}
      {symbol ? (
        <>
          <h1>Data for {symbol}</h1>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 300]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <Card style={{ width: "100%", maxWidth: "400px", marginTop: "20px" }}>
            <Card.Body>
              <Card.Title>Latest Data for {symbol}</Card.Title>
              {/* Display latest data if available */}
              <Card.Text>
                Close: {latestData.close || "N/A"}
                <br />
                High: {latestData.high || "N/A"}
                <br />
                Low: {latestData.low || "N/A"}
                <br />
                Volume: {latestData.volume || "N/A"}
                <br />
                Date: {latestData.date || "N/A"}
              </Card.Text>
            </Card.Body>
          </Card>
        </>
      ) : (
        <p>Please select a symbol to view data.</p> // Fallback text when no symbol is selected
      )}
    </div>
  );
}

export default SymbolData;
