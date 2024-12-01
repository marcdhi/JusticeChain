import json
from redis import Redis
from ..config import settings
from typing import List

class RedisClient:
    def __init__(self):
        self.redis = Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            decode_responses=True
        )

    def get_case(self, case_id: str):
        data = self.redis.get(f"case:{case_id}")
        return json.loads(data) if data else None

    def create_case(self, case_id: str, case_data: dict):
        self.redis.set(f"case:{case_id}", json.dumps(case_data))
        # Add to case list for easy retrieval
        self.redis.sadd("cases", case_id)
        return case_data

    def update_case(self, case_id: str, case_data: dict):
        self.redis.set(f"case:{case_id}", json.dumps(case_data))
        return case_data

    def list_cases(self):
        case_ids = self.redis.smembers("cases")
        cases = []
        for case_id in case_ids:
            case_data = self.get_case(case_id)
            if case_data:
                cases.append(case_data)
        return cases

    def append_chat_message(self, case_id: str, message: dict):
        """Append a chat message to the case's chat history"""
        key = f"chat:{case_id}"
        self.redis.rpush(key, json.dumps(message))

    def get_chat_messages(self, case_id: str) -> List[dict]:
        """Get all chat messages for a case"""
        key = f"chat:{case_id}"
        messages = self.redis.lrange(key, 0, -1)
        return [json.loads(msg) for msg in messages]

redis_client = RedisClient() 