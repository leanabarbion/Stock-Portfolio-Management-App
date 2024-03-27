from flask import Flask, jsonify, request, Response, redirect, session
import requests
from io import StringIO
import csv
from flask_cors import CORS, cross_origin
import hashlib
from models import db, PortfolioStock, Stock, User, Portfolio
from sqlalchemy.pool import NullPool
import oracledb
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from sqlalchemy.exc import NoResultFound


app = Flask(__name__)
bcrypt = Bcrypt()

CORS(
    app,
    supports_credentials=True,
    resources={r"*": {"origins": "http://localhost:3000"}},
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
@app.route("/api/add-stock", methods=["POST"])
@cross_origin()
def add_stock():
    # Extract stock symbol and name from the request
    symbol = request.json.get("symbol")
    name = request.json.get("name")  # Name is optional
    # investment_amount = request.json.get("investment_amount", 0.0)

    # Ensure the stock exists in the database
    stock, created = get_or_create(
        db.session, Stock, defaults={"name": name} if name else {}, symbol=symbol
    )

    return (
        jsonify({"message": "Stock added to portfolio", "stock": stock.to_dict()}),
        200,
    )


# Returns a list of all stocks currently stored in the database.
@app.route("/api/all-stocks", methods=["GET"])
@cross_origin()
def get_stocks():
    stocks = Stock.query.all()  # This line fetches all stocks from the database
    stock_list = [{"symbol": stock.symbol, "name": stock.name} for stock in stocks]
    return jsonify(stock_list)


# Deletes a specific stock from the database based on the provided symbol.
@app.route("/api/delete-stock", methods=["POST"])
@cross_origin()
def delete_stock():
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


@app.route("/api/quote/<symbol>")
def quote_price(symbol):
    # Fetches the latest stock quote for a specific symbol from Alpha Vantage API
    url = f"{CSV_URL}?function=GLOBAL_QUOTE&symbol={symbol}&apikey={YOUR_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raises an HTTPError for bad responses
        data = response.json()

        # Check if the "Global Quote" and "05. price" keys exist in the response
        if "Global Quote" in data and "05. price" in data["Global Quote"]:
            last_price = float(data["Global Quote"]["05. price"])
            return jsonify({"symbol": symbol, "last_price": last_price})
        else:
            # Handles the case where the expected data isn't present
            return jsonify({"error": "Price data not found for the given symbol"}), 404
    except requests.RequestException as e:
        # Handles exceptions related to the request, such as connectivity issues, timeouts, etc.
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 503
    except ValueError:
        # Handles errors that occur during type conversion (e.g., converting price to float)
        return jsonify({"error": "Invalid data format received"}), 500
    except KeyError:
        # Handles missing keys in the JSON response
        return (
            jsonify({"error": "Unexpected response structure from Alpha Vantage API"}),
            500,
        )
    except Exception as e:
        # A generic catch-all for any other unexpected errors
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route("/api/user/portfolio", methods=["GET"])
def portfolio():
    # Ensure the user is authenticated
    user_id = session.get("user_id")
    app.logger.info(f"Fetching portfolio for user_id: {user_id}")  # Debugging line
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        # Attempt to fetch the user's portfolio based on user_id
        user_portfolio = Portfolio.query.filter_by(user_id=user_id).first()
        if not user_portfolio:
            return jsonify({"message": "No portfolio found for user"}), 404

        # Join PortfolioStock with Stock and filter by the user's portfolio_id
        portfolio_stocks = (
            PortfolioStock.query.join(Stock, PortfolioStock.stock_id == Stock.stock_id)
            .filter(PortfolioStock.portfolio_id == user_portfolio.portfolio_id)
            .all()
        )

        # Check if the user's portfolio contains any stocks
        if not portfolio_stocks:
            return jsonify({"message": "Portfolio is empty"}), 404

        # Construct the response data
        portfolio_data = [
            {
                "symbol": stock.stock.symbol,
                "name": stock.stock.name,
                "quantity": stock.quantity,
                "acquisition_price": stock.acquisition_price,
                "acquisition_date": stock.acquisition_date.isoformat(),
            }
            for stock in portfolio_stocks
        ]
        # Log the fetched portfolio data for debugging
        app.logger.info(f"Fetched portfolio for user_id: {user_id}: {portfolio_data}")

        return jsonify(portfolio_data)
    except SQLAlchemyError as e:
        # Handle database errors
        app.logger.error(f"Database error: {e}")
        return (
            jsonify({"error": "Database error occurred, please try again later."}),
            500,
        )
    except Exception as e:
        # Catch-all for any other unexpected errors
        app.logger.error(f"Unexpected error: {e}")
        return (
            jsonify({"error": "An unexpected error occurred, please try again later."}),
            500,
        )


@app.route("/api/portfolio/add", methods=["POST"])
def add_portfolio():
    data = request.json
    symbol = data.get("symbol")
    additional_quantity = data.get("quantity", 1)  # Default quantity
    current_user_id = session.get("user_id")

    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 403

    # Attempt to fetch the current price of the stock
    current_price = quote_price(symbol)
    if not isinstance(current_price, (int, float)):
        return jsonify({"error": "Unable to fetch current stock price"}), 500

    try:
        # Find or create the stock in the database
        stock_entry = Stock.query.filter_by(symbol=symbol).first()
        if stock_entry is None:
            # Optionally handle adding new stocks to your database
            return jsonify({"error": f"Stock {symbol} does not exist"}), 404

        user_portfolio = Portfolio.query.filter_by(
            user_id=current_user_id
        ).first_or_404(description="Portfolio does not exist")

        # Locate or initialize the stock within the user's portfolio
        investment_entry, created = PortfolioStock.query.get_or_create(
            portfolio_id=user_portfolio.portfolio_id,
            stock_id=stock_entry.stock_id,
            defaults={
                "quantity": 0,
                "acquisition_price": current_price,
                "acquisition_date": datetime.now(),
            },
        )

        if not created:
            # Update existing investment with additional quantity
            investment_entry.quantity += additional_quantity
        else:
            # New investment, set quantity
            investment_entry.quantity = additional_quantity

        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Portfolio updated successfully",
                    "symbol": symbol,
                    "total_quantity": investment_entry.quantity,
                }
            ),
            200,
        )
    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f"Database error: {e}")
        return jsonify({"error": "Database transaction failed"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.route("/api/portfolio/remove", methods=["POST"])
def remove_portfolio():
    # Retrieving request data
    data = request.json
    symbol = data.get("symbol")
    quantity = data.get(
        "quantity", 1
    )  # Default decrement quantity to 1 if not specified
    user_id = session.get("user_id")

    # Authentication check
    if not user_id:
        return jsonify({"error": "User authentication required"}), 401

    # Locate the portfolio
    user_portfolio = Portfolio.query.filter_by(user_id=user_id).first()
    if not user_portfolio:
        return jsonify({"error": "No portfolio found for user"}), 404

    # Locate the stock within the portfolio
    target_stock = Stock.query.filter_by(symbol=symbol).first()
    if not target_stock:
        return jsonify({"error": "Stock symbol not recognized"}), 404

    # Find the portfolio-stock relationship
    portfolio_stock_entry = PortfolioStock.query.filter_by(
        portfolio_id=user_portfolio.portfolio_id, stock_id=target_stock.stock_id
    ).first()
    if not portfolio_stock_entry:
        return jsonify({"error": "Stock not present in user portfolio"}), 404

    # Adjust stock quantity or remove if necessary
    if portfolio_stock_entry.quantity > quantity:
        portfolio_stock_entry.quantity -= quantity
        action_message = "Reduced stock quantity."
    elif portfolio_stock_entry.quantity == quantity:
        db.session.delete(portfolio_stock_entry)
        action_message = "Stock removed from portfolio."
    else:
        return (
            jsonify(
                {"error": "Cannot remove more stocks than are present in the portfolio"}
            ),
            400,
        )

    db.session.commit()
    return jsonify({"message": action_message})


# Authenticates a user based on the provided username and password, and establishes a session if successful.
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        # Check if username and password are provided
        if not username or not password:
            return jsonify({"error": "Username and password are required."}), 400

        user = User.query.filter_by(name=username).first()

        if user and bcrypt.check_password_hash(user.password_hash, password):
            session["user_id"] = user.user_id
            session["username"] = username
            app.logger.info(f"User ID {session['user_id']}")

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
        if existing_user := User.query.filter_by(name=username).first():
            return jsonify({"error": "Username already taken"}), 409

        # Here, you might want to add more checks, e.g., password strength, username length, etc.

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
        new_user = User(name=username, password_hash=hashed_password)
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
