from fastapi import FastAPI

app = FastAPI()

@app.get("/api/health")
def health_check():
    return {"status": "running"}

# Add your existing routes here...