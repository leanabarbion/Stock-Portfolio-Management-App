from flask import Flask, jsonify
import requests
from io import StringIO
import csv


# 93T39LM1F63A0IH9
app = Flask(__name__)
YOUR_API_KEY = "demo"

CSV_URL = (
    f"https://www.alphavantage.co/query?function=LISTING_STATUS&apikey={YOUR_API_KEY}"
)


@app.route("/")
def list_symbols():
    with requests.Session() as s:
        download = s.get(CSV_URL)
        decoded_content = download.content.decode("utf-8")

        # Use StringIO to convert the string data into a file-like object for csv.reader
        cr = csv.reader(StringIO(decoded_content), delimiter=",")
        my_list = list(cr)

        # Extract the "symbol" from each row, assuming 'symbol' is in the first column
        symbols = [row[0] for row in my_list[1:]]  # Exclude the header row

        return jsonify(symbols)


if __name__ == "__main__":
    app.run(debug=True)
