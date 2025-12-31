from fastapi import FastAPI, Request, Form, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.params import Body
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import json
import os
import secrets
from typing import Optional
from datetime import datetime
import shutil

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")
security = HTTPBasic()

# Admin credentials (In production, use environment variables and hashed passwords)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

def get_data():
    """Load portfolio data from JSON file"""
    with open("data.json", "r") as f:
        return json.load(f)

def save_data(data):
    """Save portfolio data to JSON file with backup"""
    # Create backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = "backups"
    os.makedirs(backup_dir, exist_ok=True)
    shutil.copy("data.json", f"{backup_dir}/data_backup_{timestamp}.json")
    
    # Save new data
    with open("data.json", "w") as f:
        json.dump(data, f, indent=2)

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/", response_class=HTMLResponse)
async def serve_portfolio(request: Request):
    """Serve the main portfolio page"""
    portfolio_data = get_data()
    return templates.TemplateResponse(
        "portfolio.html", 
        {"request": request, "data": portfolio_data}
    )

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request, username: str = Depends(verify_admin)):
    """Serve the admin panel"""
    portfolio_data = get_data()
    return templates.TemplateResponse(
        "admin.html",
        {"request": request, "data": portfolio_data, "username": username}
    )

@app.get("/api/data")
async def get_portfolio_data(username: str = Depends(verify_admin)):
    """API endpoint to get current portfolio data"""
    return get_data()

@app.post("/api/data")
async def update_portfolio_data(
    request: Request,
    username: str = Depends(verify_admin),
    data: dict = Body(...)
):
    """API endpoint to update portfolio data"""
    try:
        # data = await request.json()
        save_data(data)
        return {"success": True, "message": "Data updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)+" --- "+str(data))

@app.get("/api/backups")
async def list_backups(username: str = Depends(verify_admin)):
    """List all available backups"""
    backup_dir = "backups"
    if not os.path.exists(backup_dir):
        return {"backups": []}
    
    backups = []
    for filename in sorted(os.listdir(backup_dir), reverse=True):
        if filename.startswith("data_backup_") and filename.endswith(".json"):
            filepath = os.path.join(backup_dir, filename)
            backups.append({
                "filename": filename,
                "size": os.path.getsize(filepath),
                "modified": datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
            })
    
    return {"backups": backups}

@app.post("/api/restore/{filename}")
async def restore_backup(filename: str, username: str = Depends(verify_admin)):
    """Restore from a backup file"""
    backup_path = os.path.join("backups", filename)
    
    if not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="Backup not found")
    
    try:
        with open(backup_path, "r") as f:
            data = json.load(f)
        save_data(data)
        return {"success": True, "message": f"Restored from {filename}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/preview", response_class=HTMLResponse)
async def preview_portfolio(request: Request, username: str = Depends(verify_admin)):
    """Preview portfolio with current data"""
    portfolio_data = get_data()
    return templates.TemplateResponse(
        "portfolio.html",
        {"request": request, "data": portfolio_data}
    )