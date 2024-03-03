from flask import Flask, jsonify, request
import requests
from io import StringIO
import csv
from flask_cors import CORS, cross_origin

# 93T39LM1F63A0IH9
app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

app.config["CORS_HEADERS"] = "Content-Type"
YOUR_API_KEY = "demo"

CSV_URL = "https://www.alphavantage.co/query"


@app.route("/symbols")
@cross_origin()
def list_symbols():
    with requests.Session() as s:
        download = s.get(f"{CSV_URL}?function=LISTING_STATUS&apikey={YOUR_API_KEY}")
        decoded_content = download.content.decode("utf-8")

        # Use StringIO to convert the string data into a file-like object for csv.reader
        cr = csv.reader(StringIO(decoded_content), delimiter=",")
        my_list = list(cr)

        # Extract the "symbol" from each row, assuming 'symbol' is in the first column
        symbols = [row[0] for row in my_list[1:]]  # Exclude the header row

        return jsonify({"symbols": symbols})


@app.route("/portfolio")
@cross_origin()
def list_portfolio():
    # Get symbols from query parameter and split into a list
    symbols = request.args.get("symbols")
    if not symbols:
        return jsonify({"error": "No symbols provided"}), 400
    # symbols = "AAPL,MSFT,GOOGL"
    symbols_list = symbols.split(",")

    # Initialize an empty list to store stock data
    results = []

    # Loop over the symbols to fetch their data
    for symbol in symbols_list:
        symbol = symbol.strip()
        response = requests.get(
            f"{CSV_URL}?function=GLOBAL_QUOTE&symbol={symbol}&apikey={YOUR_API_KEY}"
        )

        if response.status_code == 200:
            data = response.json()
            if "Global Quote" in data:
                global_quote = data["Global Quote"]
                results.append(
                    {
                        "ticker": global_quote.get("01. symbol"),
                        "high": global_quote.get("03. high"),
                        "current": global_quote.get("05. price"),
                    }
                )
            else:
                results.append({"ticker": symbol, "error": "Data not found"})
        else:
            results.append({"ticker": symbol, "error": "Failed to fetch data"})

    # Return the list of stock data as JSON
    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True)
