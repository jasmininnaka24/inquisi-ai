from fastapi import FastAPI
import os
import json
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI

load_dotenv(override=True)
api_key = os.getenv('OPENROUTER_API_KEY')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

def generate_response(system_prompt: str, user_prompt: str) -> str:
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    response = client.chat.completions.create(
        model="deepseek/deepseek-chat-v3-0324:free",
        messages=messages,
        stream=False
    )
    return response.choices[0].message.content.strip()

class CategoryModel(BaseModel):
    category: str

@app.get("/")
def index():
    return {"message": "API key found and backend is running!"}

@app.post("/category")
def generate_question_and_distractions(category: CategoryModel):
    topic = category.category

    # Step 1: Generate a clear, factual question
    question_prompt = (
        f"Generate a factual quiz question about {topic}. "
        f"Do NOT include any answer choices like a), b), c), or d). "
        f"Only return the question as a single sentence."
    )
    question = generate_response(question_prompt, topic)

    # Step 2: Generate the correct answer
    answer_prompt = (
        f"The question is: '{question}'. Provide the one correct, factual answer. "
        f"Respond with only the answer using one word or a short phrase. No explanations."
    )
    answer = generate_response("You are a helpful AI assistant.", answer_prompt)

    # Step 3: Generate distractors
    distractor_prompt = (
        f"The question is: '{question}'. The correct answer is '{answer}'. "
        f"Generate 3 wrong but realistic options (distractors) for this question. "
        f"Return them as a plain JSON array, like this: [\"Wrong1\", \"Wrong2\", \"Wrong3\"]"
    )
    distractors_raw = generate_response("You are a test creator.", distractor_prompt)

    try:
        distractors = json.loads(distractors_raw)
    except Exception:
        distractors = [d.strip("-• ") for d in distractors_raw.strip().split("\n") if d.strip()]

    return JSONResponse(content={
        "question": question,
        "answer": answer,
        "distractions": distractors
    })
