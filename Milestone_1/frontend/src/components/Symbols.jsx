import { useEffect, useState } from "react";

function Symbols() {
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    const fetchSymbol = async () => {
      const response = await fetch("http://127.0.0.1:5000");
      const data = await response.json();
      setSymbol(data);
    };
    fetchSymbol();
  }, []);
  return <div>{symbol}</div>;
}

export default Symbols;
