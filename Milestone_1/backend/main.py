from flask import Flask, jsonify, request
import requests
from io import StringIO
import csv
from flask_cors import CORS, cross_origin

# 93T39LM1F63A0IH9
app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
app.config["CORS_HEADERS"] = "Content-Type"
YOUR_API_KEY = "93T39LM1F63A0IH9"

CSV_URL = "https://www.alphavantage.co/query"


@app.route("/symbols")
@cross_origin()
def list_symbols():
    with requests.Session() as s:
        download = s.get(f"{CSV_URL}function=LISTING_STATUS&apikey={YOUR_API_KEY}")
        decoded_content = download.content.decode("utf-8")

        # Use StringIO to convert the string data into a file-like object for csv.reader
        cr = csv.reader(StringIO(decoded_content), delimiter=",")
        my_list = list(cr)

        # Extract the "symbol" from each row, assuming 'symbol' is in the first column
        symbols = [row[0] for row in my_list[1:]]  # Exclude the header row

        return jsonify({"symbols": symbols})


@app.route("/list-portfolio")
@cross_origin()
def list_portfolio():
    symbols = request.args.get("symbols")
    if not symbols:
        return jsonify({"error": "No symbols provided"}), 400

    symbols_list = symbols.split(",")  # Supports multiple symbols separated by commas
    results = []

    for symbol in symbols_list:
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol.strip(),
            "apikey": YOUR_API_KEY,
        }
        response = requests.get(CSV_URL, params=params)
        if response.status_code == 200:
            if data := response.json().get("Global Quote", {}):
                results.append(
                    {
                        "ticker": data.get("01. symbol"),
                        "high": data.get("03. high"),
                        "current": data.get("05. price"),
                    }
                )
            else:
                results.append({"ticker": symbol, "error": "Data not found"})
        else:
            results.append({"ticker": symbol, "error": "Failed to fetch data"})

    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True)
