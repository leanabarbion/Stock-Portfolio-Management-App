from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import Sequence
from sqlalchemy.schema import FetchedValue

db = SQLAlchemy()


class Users(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    # Relationship to Portfolio
    portfolios = db.relationship("Portfolio", backref="users", lazy=True)


class Stock(db.Model):
    __tablename__ = "stock"
    # stock_id = db.Column(db.Integer, primary_key=True)
    stock_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    symbol = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)

    # Relationship to PortfolioStock
    portfolio_stocks = db.relationship("PortfolioStock", backref="stock", lazy=True)

    def to_dict(self):
        return {
            "stock_id": self.stock_id,
            "symbol": self.symbol,
            "name": self.name,
        }


class Portfolio(db.Model):
    __tablename__ = "portfolio"
    portfolio_id = db.Column(
        db.Integer,
        Sequence("portfolio_id_seq"),
        primary_key=True,
        server_default=FetchedValue(),
        autoincrement=True,
    )
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    created_at = db.Column(db.TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(
        db.TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationship to PortfolioStock
    portfolio_stocks = db.relationship("PortfolioStock", backref="portfolio", lazy=True)


class PortfolioStock(db.Model):
    __tablename__ = "portfolio_stocks"
    portfolio_stock_id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(
        db.Integer, db.ForeignKey("portfolio.portfolio_id"), nullable=False
    )
    stock_id = db.Column(db.Integer, db.ForeignKey("stock.stock_id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    acquisition_price = db.Column(db.Float, nullable=False)
    acquisition_date = db.Column(db.Date, nullable=False)

    def to_dict(self):
        return {
            "portfolio_stock_id": self.portfolio_stock_id,
            "portfolio_id": self.portfolio_id,
            "stock_id": self.stock_id,
            "quantity": self.quantity,
            "acquisition_price": self.acquisition_price,
            "acquisition_date": self.acquisition_date.isoformat(),  # Assuming this is a date
        }
