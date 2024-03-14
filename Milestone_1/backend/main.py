from flask import Flask, jsonify, request, Response, redirect, session
import requests
from io import StringIO
import csv
from flask_cors import CORS, cross_origin
import hashlib
from models import db, Portfolio, Stock, User
from sqlalchemy.pool import NullPool
import oracledb
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)

CORS(app, supports_credentials=True)
un = "ADMIN"
pw = "QvcBEs_Mmr5Si4t"
dsn = "(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.eu-paris-1.oraclecloud.com))(connect_data=(service_name=g4985bc5c80162f_i8dqu4u6xk44u8p6_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))"
pool = oracledb.create_pool(user=un, password=pw, dsn=dsn)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "oracle+oracledb://ADMIN:QvcBEs_Mmr5Si4t@adb.eu-paris-1.oraclecloud.com:1521/g4985bc5c80162f_i8dqu4u6xk44u8p6_high.adb.oraclecloud.com?ssl_server_dn_match=yes"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "something very secret"
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "creator": pool.acquire,
    "poolclass": NullPool,
}
app.config.update(SESSION_COOKIE_SAMESITE="None", SESSION_COOKIE_SECURE=True)

app.config["SQLALCHEMY_ECHO"] = True
db.init_app(app)

with app.app_context():
    db.create_all()

app.config["CORS_HEADERS"] = "Content-Type"
YOUR_API_KEY = "NKH8SNZW8I690AJQ"
CSV_URL = "https://www.alphavantage.co/query"


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


@app.route("/api/stock-details")
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


# Function to get or create a stock based on its symbol
def get_or_create_stock(symbol, name=None):
    """
    Attempts to find a stock with the given symbol. If found, returns the stock.
    If not found, creates a new stock with the provided symbol and name, then returns it.
    """
    stock = Stock.query.filter_by(symbol=symbol).first()
    if not stock:
        stock = Stock(symbol=symbol, name=name)
        db.session.add(stock)
        db.session.commit()
    return stock


@app.route("/api/add-stock", methods=["POST"])
@cross_origin()
def add_stock_portfolio():
    # Extract stock symbol and name from the request
    symbol = request.json.get("symbol")
    name = request.json.get("name")  # Name is optional
    # investment_amount = request.json.get("investment_amount", 0.0)

    # Ensure the stock exists in the database
    stock = get_or_create_stock(symbol, name)

    # Now you can proceed to add the stock to the user's portfolio
    # This step depends on your application's models and logic
    # ...

    return (
        jsonify({"message": "Stock added to portfolio", "stock": stock.to_dict()}),
        200,
    )


@app.route("/api/stocks", methods=["GET"])
@cross_origin()
def get_stocks():
    stocks = Stock.query.all()  # This line fetches all stocks from the database
    stock_list = [{"symbol": stock.symbol, "name": stock.name} for stock in stocks]
    return jsonify(stock_list)


@app.route("/api/delete-stock", methods=["POST"])
@cross_origin()
def delete_stock():
    # Assuming the symbol uniquely identifies the stock
    symbol = request.json.get("symbol")

    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400

    stock = Stock.query.filter_by(symbol=symbol).first()

    if stock:
        # If the stock exists, delete it
        db.session.delete(stock)
        db.session.commit()
        return jsonify({"message": f"Stock {symbol} deleted successfully"}), 200
    else:
        return jsonify({"error": "Stock not found"}), 404


@app.route("/api/login", methods=["POST"])
@cross_origin()
def login():

    # Extract username and password from request
    username = request.json.get("username")
    password = request.json.get("password")

    # Look for the user in the database
    user = User.query.filter_by(username=username).first()

    # If user exists and passwords match
    if user and user.password_hash == password:
        # Login success logic here
        # For example, setting the user ID in the session
        session["username"] = username
        session["user_id"] = user.id

        return jsonify({"message": "Login successful", "username": username}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401


@app.route("/api/add-stock-to-user-portfolio", methods=["POST"])
def add_stock_to_user_portfolio():
    if "user_id" not in session:
        return jsonify({"error": "User not logged in"}), 403

    user_id = session["user_id"]
    symbol = request.json.get("symbol")
    investment_amount = request.json.get("investment_amount", 0.0)

    if not symbol or investment_amount <= 0:
        return jsonify({"error": "Invalid input"}), 400

    stock = get_or_create_stock(symbol)
    if not stock:
        return jsonify({"error": "Stock could not be processed"}), 500

    existing_entry = Portfolio.query.filter_by(
        user_id=user_id, stock_id=stock.id
    ).first()
    if existing_entry:
        # Update investment amount
        existing_entry.investment_amount += investment_amount
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Investment amount updated for existing stock",
                    "portfolio_entry": existing_entry.to_dict(),
                }
            ),
            200,
        )

    new_entry = Portfolio(
        user_id=user_id, stock_id=stock.id, investment_amount=investment_amount
    )
    db.session.add(new_entry)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Stock added to portfolio",
                "portfolio_entry": new_entry.to_dict(),
            }
        ),
        201,
    )


@app.route("/api/remove-stock-from-portfolio/<int:stock_id>", methods=["DELETE"])
@cross_origin()
def remove_stock_from_portfolio(stock_id):
    if "user_id" not in session:
        return jsonify({"error": "User not logged in"}), 403

    user_id = session["user_id"]
    portfolio_entry = Portfolio.query.filter_by(
        user_id=user_id, stock_id=stock_id
    ).first()

    if portfolio_entry:
        db.session.delete(portfolio_entry)
        db.session.commit()
        return jsonify({"message": "Stock removed from portfolio"}), 200
    else:
        return jsonify({"error": "Stock not found in portfolio"}), 404


if __name__ == "__main__":
    app.run(debug=True)
