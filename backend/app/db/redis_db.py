import json
from redis import Redis
from ..config import settings

class RedisClient:
    def __init__(self):
        self.redis = Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            decode_responses=True
        )

    async def get_case(self, case_id: str):
        data = self.redis.get(f"case:{case_id}")
        return json.loads(data) if data else None

    async def create_case(self, case_id: str, case_data: dict):
        self.redis.set(f"case:{case_id}", json.dumps(case_data))
        # Add to case list for easy retrieval
        self.redis.sadd("cases", case_id)
        return case_data

    async def update_case(self, case_id: str, case_data: dict):
        self.redis.set(f"case:{case_id}", json.dumps(case_data))
        return case_data

    async def list_cases(self):
        case_ids = self.redis.smembers("cases")
        cases = []
        for case_id in case_ids:
            case_data = await self.get_case(case_id)
            if case_data:
                cases.append(case_data)
        return cases

redis_client = RedisClient() 