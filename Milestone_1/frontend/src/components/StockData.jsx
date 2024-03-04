import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Card, Button } from "react-bootstrap";

function SymbolData() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [trendData, setTrendData] = useState([]);
  const [startDate, setStartDate] = useState(""); // Ensure these are managed
  const [endDate, setEndDate] = useState(""); // either as props or state
  const [latestData, setLatestData] = useState({}); // To store the latest data separately

  useEffect(() => {
    const url =
      `http://127.0.0.1:5000/data?symbol=${symbol}` +
      `${startDate && `&start=${startDate}`}` +
      `${endDate && `&end=${endDate}`}`;

    axios
      .get(url)
      .then((response) => {
        // Transform the data here if necessary
        console.log("Received trend data:", response.data.trend_data);
        setTrendData(response.data.trend_data); // Adjust according to actual data structure
        if (response.data.trend_data.length > 0) {
          // Assuming the last item in the array is the latest
          setLatestData(
            response.data.trend_data[response.data.trend_data.length - 1]
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching trend data for symbol:", symbol, error);
      });
  }, [symbol, startDate, endDate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "30px",
      }}
    >
      <h1>Data for {symbol}</h1>
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "row", // Changed from "column" to "row"
          gap: "10px", // Adds space between buttons
        }}
      >
        <Button variant="secondary" onClick={() => navigate("/")}>
          Home
        </Button>
        <Button variant="primary" onClick={() => navigate("/portfolio")}>
          Go to Portfolio
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          gap: "20px",
        }}
      >
        <ResponsiveContainer width="75%" height={400}>
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
        <Card style={{ flex: 1, maxWidth: "400px" }}>
          {" "}
          {/* Adjust width as needed */}
          <Card.Body>
            <Card.Title>
              {symbol} on{" "}
              {trendData.length > 0
                ? trendData[trendData.length - 1].date
                : "Loading..."}
            </Card.Title>
            <Card.Text>
              Close: {latestData.close}
              <br />
              High: {latestData.high}
              <br />
              Low: {latestData.low}
              <br />
              Volume: {latestData.volume}
              <br />
              Date: {latestData.date}
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default SymbolData;
