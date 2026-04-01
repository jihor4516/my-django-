class SimpleCORSMiddleware:
    """Allow requests from configured frontend origins in development."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        origin = request.headers.get('Origin', '')
        allowed_origins = {
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        }
        if origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Vary'] = 'Origin'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken, X-Requested-With'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, DELETE, OPTIONS'
        if request.method == 'OPTIONS':
            response.status_code = 200
        return response
