def test_health_check(client):
    """Test the health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_cors_headers(client):
    """Test that CORS origin headers are correctly injected."""
    response = client.options(
        "/health", 
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"}
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
