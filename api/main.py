from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.params import Body
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import json
import os 
from pathlib import Path
import secrets
from datetime import datetime
from dotenv import load_dotenv
from github import Github,Auth

app = FastAPI()
BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=f"{BASE_DIR}/templates")
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
security = HTTPBasic()

load_dotenv()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = os.getenv("GITHUB_REPO")
FILE_PATH = "data.json"

def get_data():
    try:
        auth = Auth.Token(GITHUB_TOKEN)
        g = Github(auth=auth)
        repo = g.get_repo(REPO_NAME)
        contents = repo.get_contents(FILE_PATH)
        return json.loads(contents.decoded_content.decode())
    except Exception as e:
        print(f"[WARN] GitHub Error: {e}")
        print("[INFO] Switching to local file on server...")

    try:
        with open(f"{BASE_DIR}/data.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise RuntimeError("Critical: data.json not found locally or on GitHub.")
            

def save_data(data):
    auth = Auth.Token(GITHUB_TOKEN)
    g = Github(auth=auth)
    repo = g.get_repo(REPO_NAME)

    contents = repo.get_contents(FILE_PATH)

    repo.update_file(
        path=FILE_PATH,
        message=f"Update portfolio data",
        content=json.dumps(data, indent=2),
        sha=contents.sha
    )

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
    try:
        portfolio_data = get_data()
        return templates.TemplateResponse(
            "portfolio.html", 
            {"request": request, "data": portfolio_data}
        )
    except Exception as e:
        print(f"{e} backend fails to load file ")
        raise HTTPException(status_code=500, detail=str(e)+"Backend fail to load the files")
    

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
    try:
        save_data(data)
        return {"success": True, "message": "Data updated successfully"}
    except Exception as e:
        # print("Error updating data:", str(e), "Data:", data)
        raise HTTPException(status_code=400, detail=str(e)+" --- "+str(data))

@app.get("/api/backups")
async def list_backups(username: str = Depends(verify_admin)):
    """List all available backups"""
    # Use BASE_DIR so Vercel can find the folder
    backup_dir = BASE_DIR / "backups" 
    
    if not backup_dir.exists():
        return {"backups": []}
    
    backups = []
    # Convert Path object to string for os.listdir
    for filename in sorted(os.listdir(str(backup_dir)), reverse=True):
        if filename.startswith("data_backup_") and filename.endswith(".json"):
            filepath = backup_dir / filename
            backups.append({
                "filename": filename,
                "size": os.path.getsize(filepath),
                "modified": datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
            })
    
    return {"backups": backups}

@app.post("/api/restore/{filename}")
async def restore_backup(filename: str, username: str = Depends(verify_admin)):
    """Restore from a backup file"""
    # Use BASE_DIR so Vercel can find the file
    backup_path = BASE_DIR / "backups" / filename
    
    if not backup_path.exists():
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


# ── Custom Error Handlers ──────────────────────────────────────────────────

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Render a styled error page for 404s; pass-through everything else with correct headers."""
    if exc.status_code == 404:
        return templates.TemplateResponse(
            "404.html",
            {"request": request},
            status_code=404
        )

    # For 401 / 403 (HTTP Basic Auth challenges), forward the WWW-Authenticate header
    # so the browser shows the native login dialog instead of an error page.
    headers = dict(exc.headers) if exc.headers else {}
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers if headers else None,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Render a styled error page for validation errors"""
    return templates.TemplateResponse(
        "404.html",
        {"request": request},
        status_code=422
    )