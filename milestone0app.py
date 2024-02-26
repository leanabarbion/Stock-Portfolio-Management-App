from flask import Flask, render_template, redirect, url_for, render_template, request, session
import requests

app = Flask(__name__)

YOUR_API_KEY = '93T39LM1F63A0IH9'

@app.route("/home")
def home():
    return render_template('home.html')


def get_symbols_data():
    return {
        "US": "IBM",
        "UK": "TSCO.LON",
        "Germany": "MBG.DEX"
    }


#from the list of symbols chosen, get the current and relevant past values
@app.route("/list-portfolio")
def list_portfolio():
    symbol = request.args.get('symbol')  
    if not symbol:
        return "No symbol provided", 400

    symbol_data = get_symbols_data()
    if symbol not in symbol_data.values():
        return "Symbol not found", 404

    
    response = requests.get(f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={YOUR_API_KEY}")
    weekly =requests.get(f"https://alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol={symbol}&apikey={YOUR_API_KEY}") 
    
    if response.status_code == 200:
        data=response.json()
        print(data)
        
        if "Global Quote" in data:
            global_quote = data["Global Quote"]
            ticker = global_quote.get("01. symbol")
            high = global_quote.get("03. high")
            current = global_quote.get("05. price")
        
        return render_template("stock_info.html", ticker=ticker, high =high, current = current)                               
    else: 
        print(f"·Failed to get data: {response.status_code}")
        return "Error fetching data", 500
    
#list of symbols chosen
@app.route("/")
def list_symbols():
    symbols = get_symbols_data()
    return render_template('list_symbols.html', symbols=symbols)



if __name__ == '__main__':
    app.run(debug=True)

