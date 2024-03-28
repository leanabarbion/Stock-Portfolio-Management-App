from flask import Flask, jsonify, request, Response, redirect, session
import requests
from io import StringIO
import csv
from flask_cors import CORS, cross_origin
import hashlib
from models import db, PortfolioStock, Stock, Users, Portfolio
from sqlalchemy.pool import NullPool
import oracledb
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
from sqlalchemy.exc import NoResultFound
from requests.exceptions import RequestException


app = Flask(__name__)
bcrypt = Bcrypt()

CORS(
    app,
    supports_credentials=True,
)

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
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True
db.init_app(app)

with app.app_context():
    db.create_all()

app.config["CORS_HEADERS"] = "Content-Type"
YOUR_API_KEY = "NKH8SNZW8I690AJQ"
CSV_URL = "https://www.alphavantage.co/query"


def get_or_create(session, model, defaults=None, **kwargs):
    try:
        return session.query(model).filter_by(**kwargs).one(), False
    except NoResultFound:
        if defaults:
            kwargs.update(defaults)
        instance = model(**kwargs)
        session.add(instance)
        session.commit()
        return instance, True


# Retrieves weekly trend data for a specific stock symbol from the Alphavantage API and returns it in JSON format.
@app.route("/api/stock/<symbol>")
def stock_data(symbol):
    try:
        response = requests.get(
            f"{CSV_URL}?function=TIME_SERIES_WEEKLY&symbol={symbol}&apikey={YOUR_API_KEY}"
        )

        if response.status_code != 200:
            # Log the error or notify administrators if necessary
            return (
                jsonify({"error": "Failed to fetch data from Alpha Vantage API"}),
                response.status_code,
            )

        data = response.json()
        # Error handling for unexpected response structure
        if "Weekly Time Series" not in data:
            return (
                jsonify(
                    {"error": "Unexpected data format received from Alpha Vantage API"}
                ),
                500,
            )

        weekly_time_series = data.get("Weekly Time Series", {})
        sorted_dates = sorted(weekly_time_series.items(), key=lambda x: x[0])
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
    except requests.RequestException as e:
        # This block handles exceptions related to network issues, invalid responses, etc.
        return (
            jsonify(
                {"error": f"Network error occurred while fetching stock data: {str(e)}"}
            ),
            503,
        )
    except KeyError as e:
        # This block handles errors related to accessing non-existent keys in the data
        return jsonify({"error": f"Key error in processing stock data: {str(e)}"}), 500
    except Exception as e:
        # This block is a catch-all for any other unexpected errors
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


# Adds a stock (by symbol) to the database if it doesn't already exist, and potentially to a user's portfolio. This endpoint just ensures the stock exists in the database.
@app.route("/api/portfolio/add", methods=["POST"])
@cross_origin()
def portfolio_add():
    # Extract stock symbol and name from the request
    symbol = request.json.get("symbol")
    name = request.json.get("name")

    # Ensure the stock exists in the database
    stock, created = get_or_create(
        db.session, Stock, defaults={"name": name} if name else {}, symbol=symbol
    )
    return (
        jsonify(
            {"message": f"Stock {symbol} added to portfolio", "stock": stock.to_dict()}
        ),
        200,
    )


# Utility function to fetch the quote price for a stock symbol
def quote_price(symbol):
    # You need to have YOUR_API_KEY defined somewhere in your settings
    url = f"{CSV_URL}?function=GLOBAL_QUOTE&symbol={symbol}&apikey={YOUR_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return float(data["Global Quote"]["05. price"])
    except RequestException:
        app.logger.error(f"Request failed for symbol: {symbol}")
        return None
    except (ValueError, KeyError):
        app.logger.error(f"Data parsing failed for symbol: {symbol}")
        return None


# Returns a list of all stocks currently stored in the database.
@app.route("/api/all-stocks", methods=["GET"])
@cross_origin()
def get_stocks():
    try:
        stocks = Stock.query.all()  # This line fetches all stocks from the database
        stock_list = []
        for stock in stocks:
            price = quote_price(stock.symbol)  # Fetch the quote price for each stock
            stock_info = {
                "symbol": stock.symbol,
                "name": stock.name,
                "price": price if price is not None else "Unavailable",
            }
            stock_list.append(stock_info)
        return jsonify(stock_list)
    except Exception as e:
        app.logger.error(f"Failed to fetch stocks: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Deletes a specific stock from the database based on the provided symbol.
@app.route("/api/portfolio/remove", methods=["POST"])
@cross_origin()
def portfolio_remove():
    # Assuming the symbol uniquely identifies the stock
    symbol = request.json.get("symbol")

    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400

    if stock := Stock.query.filter_by(symbol=symbol).first():
        # If the stock exists, delete it
        db.session.delete(stock)
        db.session.commit()
        return jsonify({"message": f"Stock {symbol} deleted successfully"}), 200
    else:
        return jsonify({"error": "Stock not found"}), 404


# Authenticates a user based on the provided username and password, and establishes a session if successful.
@app.route("/api/login", methods=["POST"])
def login():
    print("before log in")
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        # Check if username and password are provided
        if not username or not password:
            return jsonify({"error": "Username and password are required."}), 400

        user = Users.query.filter_by(name=username).first()
        print("trying to log in")
        if user and bcrypt.check_password_hash(user.password_hash, password):
            session["user_id"] = user.user_id
            session["username"] = username
            app.logger.info(f"User ID {session['user_id']}")
            print("log in success")
            return jsonify({"message": "Login successful", "username": username}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except SQLAlchemyError as e:
        app.logger.error(f"Database error occurred: {str(e)}")
        return jsonify({"error": "An error occurred. Please try again later."}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error occurred: {str(e)}")
        return (
            jsonify({"error": "An unexpected error occurred. Please try again later."}),
            500,
        )


@app.route("/api/signup", methods=["POST"])
def register():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        # Validate input
        if not username or not password:
            return jsonify({"error": "Username and password are required."}), 400

        # Check if user already exists
        if existing_user := Users.query.filter_by(name=username).first():
            return jsonify({"error": "Username already taken"}), 409

        # Here, you might want to add more checks, e.g., password strength, username length, etc.

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
        new_user = Users(name=username, password_hash=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User created successfully"}), 201
    except SQLAlchemyError as e:
        # Log database errors and return a generic error message
        app.logger.error(f"Database error during registration: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Registration failed due to an internal error. Please try again."
                }
            ),
            500,
        )
    except Exception as e:
        # Log unexpected errors
        app.logger.error(f"Unexpected error during registration: {str(e)}")
        return (
            jsonify({"error": "An unexpected error occurred. Please try again."}),
            500,
        )


@app.route("/api/session-check", methods=["GET"])
def check_session():
    if "user_id" in session:
        return jsonify({"isLoggedIn": True}), 200
    else:
        return jsonify({"isLoggedIn": False}), 200


@app.route("/api/logout", methods=["GET", "POST"])
def logout():
    # Clear the user's session
    session.clear()
    return jsonify({"message": "You have been logged out successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True)
