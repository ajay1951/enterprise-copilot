from fastapi import Request, HTTPException
import time
import os
import redis.asyncio as redis

# We will initialize this in main.py
redis_client = None

async def init_redis():
    global redis_client
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    redis_client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)

class RateLimiter:
    def __init__(self, times: int, seconds: int):
        self.times = times
        self.seconds = seconds

    async def __call__(self, request: Request):
        if not redis_client:
            return # Skip if redis isn't initialized yet
            
        client_ip = request.client.host if request.client else "unknown"
        # Create a unique key based on the IP and the endpoint path
        key = f"rate_limit:{request.scope['path']}:{client_ip}"
        
        current_time = int(time.time())
        window_start = current_time - self.seconds

        # Use a pipeline for atomic operations
        pipeline = redis_client.pipeline()
        
        # Remove old requests outside the time window
        pipeline.zremrangebyscore(key, 0, window_start)
        
        # Count remaining requests in the window
        pipeline.zcard(key)
        
        # Add the current request
        pipeline.zadd(key, {str(current_time): current_time})
        
        # Set expiry on the key so it doesn't leak memory
        pipeline.expire(key, self.seconds)
        
        results = await pipeline.execute()
        
        # results[1] contains the zcard (number of requests in the window before adding the current one)
        request_count = results[1]
        
        if request_count >= self.times:
            raise HTTPException(
                status_code=429, 
                detail="Too Many Requests. Rate limit exceeded. Please try again later."
            )
