# Stock Portfolio Management System

React Application visible online: http://leana-frontend-bucket.storage.googleapis.com/index.html

## Overview

This project is a Stock Portfolio Management System, designed to help users manage and track their stock investments. It offers functionality to view real-time stock data, add stocks to a personal portfolio, and calculate the total value of the portfolio. This system is built using Flask for the backend, React for the frontend, and uses OracleDB for data persistence. The backend is deployed using Google App Engine, and the frontend is hosted on a Google Cloud Storage bucket.

## Features

* Stock Data Viewing: Users can view current stock prices and trends.
* Portfolio Management: Users can add stocks to their portfolio, specify quantities, and delete stocks.
* Real-time Data: The Alpha Vantage API fetches real-time stock prices.
* User Authentication: Supports user registration, login, and logout functionalities.

## Technologies Used

* Frontend: React, Bootstrap
* Backend: Flask, Flask-CORS, Flask-Bcrypt for password hashing
* Database: OracleDB with SQLAlchemy as ORM
* External API: Alpha Vantage for stock data
* Deployment: Google App Engine for backend, Google Cloud Storage for frontend

## Setup and Installation

### Requirements
1. Python 3.9+
2. Node.js and npm
3. An OracleDB database
4. An API key from Alpha Vantage
