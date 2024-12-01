from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "JusticeChain API"
    redis_host: str = "localhost"
    redis_port: int = 6379
    
    class Config:
        env_file = ".env"

settings = Settings()