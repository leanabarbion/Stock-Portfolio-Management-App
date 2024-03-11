from flask import Flask, jsonify, request, Response, redirect, session
import requests
from io import StringIO
import csv
from flask_cors import CORS, cross_origin
import hashlib

app = Flask(__name__)
CORS(app)

app.config["CORS_HEADERS"] = "Content-Type"
YOUR_API_KEY = "NKH8SNZW8I690AJQ"

CSV_URL = "https://www.alphavantage.co/query"

app.config["SECRET_KEY"] = "something very secret"

users_database = {
    "churro": "ab5743ce10dcb8eec8eba72e2aae97f684891786",
    "gnocchi": "0adbe085fd8eb9a6ace9300130d5d3f6ff0baf22",
}


@app.route("/api/all-stocks")
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

        return Response(decoded_content, mimetype="text/csv")


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


@app.route("/api/stock/")
def stock_data():
    symbol = request.args.get("symbol")
    if not symbol:
        return jsonify({"error": "No symbol provided"}), 400

    response = requests.get(
        f"{CSV_URL}?function=TIME_SERIES_WEEKLY&symbol={symbol}&apikey={YOUR_API_KEY}"
    )

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch data"}), response.status_code

    data = response.json()
    weekly_time_series = data.get("Weekly Time Series", {})

    # Sort the weekly_time_series dictionary by date (key) in ascending order
    sorted_dates = sorted(weekly_time_series.items(), key=lambda x: x[0])

    # Now construct the trend_data list with sorted dates
    trend_data = [
        {
            "date": date,
            "open": values["1. open"],
            "high": values["2. high"],
            "low": values["3. low"],
            "close": values["4. close"],
            "volume": values["5. volume"],
        }
        for date, values in sorted_dates
    ]

    return jsonify({"symbol": symbol, "trend_data": trend_data})


@app.route("/api/handle-register", methods=["POST"])
def handle_register():
    # Get username and password from the form
    username = request.form["username"]
    password = request.form["password"]

    # Hash the password
    hashed_password = hash_value(password)

    if username in users_database:
        return jsonify({"error": "Username already exists"}), 409
    # Register the new user
    users_database[username] = hashed_password
    # Automatically log in the user by setting the session
    session["username"] = username
    # Respond with a success message
    return (
        jsonify({"success": "User registered successfully", "username": username}),
        200,
    )


def hash_value(string):
    hash = hashlib.sha1()
    hash.update(string.encode())
    return hash.hexdigest()


@app.route("/api/handle-login", methods=["POST"])
def handle_login():
    username = request.form["username"]
    password = request.form["password"]
    hashed_password = hash_value(password)

    if username not in users_database or users_database[username] != hashed_password:
        # Return an error response instead of redirecting
        return jsonify({"error": "Invalid username or password"}), 401
    session["username"] = username
    return jsonify({"success": True, "username": username})


@app.route("/logout", methods=["GET"])
def logout():
    # Remove 'username' from session
    session.pop("username", None)
    return jsonify({"success": True, "message": "Logged out successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True)
