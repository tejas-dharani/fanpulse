import asyncio
import time
from collections import deque


class GeminiRateLimiter:
    """Enforces 10 RPM for Gemini free tier using a sliding window queue."""

    def __init__(self, max_rpm: int = 10):
        self.max_rpm = max_rpm
        self.call_times: deque = deque()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            # Drop timestamps older than 60 seconds
            while self.call_times and now - self.call_times[0] >= 60:
                self.call_times.popleft()

            if len(self.call_times) >= self.max_rpm:
                wait = 60 - (now - self.call_times[0]) + 0.1
                print(f"[RATE LIMITER] At {self.max_rpm} RPM limit — waiting {wait:.1f}s")
                await asyncio.sleep(wait)
                now = time.monotonic()
                while self.call_times and now - self.call_times[0] >= 60:
                    self.call_times.popleft()

            self.call_times.append(time.monotonic())

    @property
    def current_rpm(self) -> int:
        now = time.monotonic()
        return sum(1 for t in self.call_times if now - t < 60)


rate_limiter = GeminiRateLimiter(max_rpm=10)
