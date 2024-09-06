from fastapi import FastAPI
from pydantic import BaseModel
import redis

app = FastAPI()

class TextModel(BaseModel):
    text: str

redis_clients = [
    redis.Redis(host='127.0.0.1', port=6379, decode_responses=True),
    redis.Redis(host='127.0.0.1', port=6380, decode_responses=True),
    redis.Redis(host='127.0.0.1', port=6381, decode_responses=True),
]

def get_redis_client(key: str):
    index = hash(key) % len(redis_clients)
    return redis_clients[index]

def add_text_to_redis(key: str, value: str):
    client = get_redis_client(key)
    client.set(key, value)

def get_text_from_redis(key: str):
    client = get_redis_client(key)
    return client.get(key)

@app.post('/text')
def add_text(text_model: TextModel):
    add_text_to_redis(text_model.text, text_model.text)
    return {"stored_value": get_text_from_redis(text_model.text)}

@app.get('/text/{text}')
def get_text(text: str):
    return {"retrieved_value": get_text_from_redis(text)}
