from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

def get_data():
    with open("data.json", "r") as f:
        return json.load(f)

@app.get("/", response_class=HTMLResponse)
async def serve_portfolio(request: Request):
    portfolio_data = get_data()
    return templates.TemplateResponse(
        "portfolio.html", 
        {"request": request, "data": portfolio_data}
    )