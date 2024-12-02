from fastapi import FastAPI, HTTPException
from openai import OpenAI
from transformers import pipeline, AutoTokenizer
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from ..config import settings
import random

# Pydantic Models
class LawyerContext(BaseModel):
    input: str
    context: str
    speaker: str  # "human" or "ai"
    score: float

class TurnResponse(BaseModel):
    next_turn: str  # "human" or "ai"
    case_status: str  # "open" or "closed"
    winner: Optional[str] = None
    score_difference: Optional[float] = None
    current_response: LawyerContext
    human_score: float
    ai_score: float

class ProcessInputRequest(BaseModel):
    turn_type: str
    input_text: Optional[str] = None

class ConversationList(BaseModel):
    conversations: List[LawyerContext]

class VectorDBMixin:
    """Base class for vector database functionality"""
    def __init__(self):
        # Initialize vector database
        if not os.path.exists('case_reports'):
            raise Exception("case_reports directory not found")
            
        documents = SimpleDirectoryReader(input_dir='case_reports').load_data()
        embedding_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
        self.index = VectorStoreIndex.from_documents(documents, embed_model=embedding_model)
        self.retriever = self.index.as_retriever()

class HumanAssistant(VectorDBMixin):
    def __init__(self):
        super().__init__()  # Initialize vector database
        self.llm_config = {
            "model": settings.llm_model_name,
            "api_key": settings.galadriel_api_key,
            "base_url": settings.galadriel_base_url
        }

    def ask(self, user_input):
        # First, check if context is needed using the LLM
        context_needed = self.check_context_need(user_input)
        
        if context_needed:
            # Retrieve relevant nodes based on user input
            retrieved_nodes = self.retriever.retrieve(user_input)
            # Generate a summary of the retrieved content
            summarized_response = self.summarize_content(retrieved_nodes, user_input)
            return summarized_response
        else:
            return [user_input,"No context needed"]

    def check_context_need(self, user_input):
        """Ask the LLM if additional context is needed for the given input."""
        prompt = (
            "You are an intelligent assistant to a lawyer. "
            "Based on the following statement by a lawyer, determine if additional legal context is needed:\n"
            f"'{user_input}'\n"
            "Respond with 'yes' if additional context is needed or 'no' if it is not."
        )


        client = OpenAI(
                base_url=self.llm_config["base_url"],  # Access using key "base_url"
                api_key=self.llm_config["api_key"]     # Access using key "api_key"
        )
        
        # Call the OpenAI ChatCompletion API to check if context is needed
        llm_response = client.chat.completions.create(
            model=self.llm_config["model"],
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0  # Adjust temperature as needed for creativity
        )

        decision = llm_response.choices[0].message.content.strip().lower()
        return decision == "yes"

    def summarize_content(self, nodes, user_input):
        """Summarize retrieved content based on user input."""
        # Check if any nodes were retrieved
        if not nodes:
            return "No relevant context found."

        # Format the retrieved nodes for LLM input
        documents_text = "\n".join([node.text for node in nodes])  # Assuming each node has a 'text' attribute

        # Create a prompt for summarization as an assistant to a lawyer
        prompt = (
            f"You are an intelligent assistant to a lawyer. Your role is to summarize legal documents "
            f"that are relevant to what the lawyer is discussing. The lawyer has stated: '{user_input}'.\n\n"
            f"The following documents contain related information:\n\n{documents_text}\n\n"
            f"Based on these documents, provide a concise summary that highlights the context and evidence "
            f"that supports or relates to the lawyer's statement."
        )

        # Call the OpenAI ChatCompletion API to generate a summary
        client = OpenAI(
                base_url=self.llm_config["base_url"],  # Access using key "base_url"
                api_key=self.llm_config["api_key"]     # Access using key "api_key"
        )
        llm_response = client.chat.completions.create(
            model=self.llm_config["model"],
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0  # Adjust temperature as needed for creativity
        )

        return [user_input, llm_response.choices[0].message.content]  # Accessing content correctly

class AILawyer(VectorDBMixin):
    def __init__(self):
        super().__init__()  # Initialize vector database
        self.llm_config = {
            "model": settings.llm_model_name,
            "api_key": settings.galadriel_api_key,
            "base_url": settings.galadriel_base_url
        }

    def respond(self, query):
        response = self.retriever.retrieve(query)
        generated_response = self.generate_response(response, query)
        return {
            "input": "AI Lawyer's Argument",
            "context": generated_response,
            "speaker": "ai"
        }

    def generate_response(self, response, query):
        # Create a prompt for the LLM using the user query and retrieved response
        prompt = (
            f"You are an experienced lawyer in a courtroom setting. "
            f"Your task is to respond to legal inquiries with precision and authority. "
            f"The following is the response obtained from previous documents: '{response}'. "
            f"The question asked is: '{query}'. "
            f"Now, based on these two pieces of information, generate a coherent and concise legal response. "
            f"Include the obtained response only if it is relevant to the question; otherwise, provide a concise answer without it. "
            f"Ensure your response reflects legal expertise and is directed towards an opposing counsel."
        )

        client = OpenAI(
            base_url=self.llm_config["base_url"],
            api_key=self.llm_config["api_key"]
        )
        
        # Call the OpenAI ChatCompletion API to generate a response
        llm_response = client.chat.completions.create(
            model=self.llm_config["model"],
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7  # Increased temperature for more varied responses
        )

        return llm_response.choices[0].message.content

class HumanLawyer:
    def __init__(self):
        self.assistant = HumanAssistant()

    def ask(self):
        argument = input("Human Lawyer: ")  # Prompt for user input #here is the post request part about how the input will be taken in the case of the user 
        response = self.assistant.ask(argument)
        
        # Format output with input and context
        output = f"Input: {response[0]}. Context: {response[1]}."
        return output # pydantic model with the schema should be there in this case
    
#Judge and Simulation Logic 

class Judge:
    def __init__(self):
        self.llm_config = {
            "model": settings.llm_model_name,
            "api_key": settings.galadriel_api_key,
            "base_url": settings.galadriel_base_url
        }
        self.conversations = []
        self.human_score = 0
        self.ai_score = 0
        
        # Initialize sentiment analysis pipelines
        self.sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")
        self.coherence_model = pipeline("text-classification", model="textattack/bert-base-uncased-snli")
        self.ner_model = pipeline("ner", aggregation_strategy="simple", model="dbmdz/bert-large-cased-finetuned-conll03-english")
        self.tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
        self.current_turn = None  # Track whose turn it is

    def analyze_response(self, response, is_human):
        """Analyze the response using sentiment, coherence, and NER models."""
        
        # Calculate sentiment score (example: positive=1, negative=0)
        sentiment_result = self.sentiment_analyzer(response)
        sentiment_score = 1 if sentiment_result[0]['label'] == 'POSITIVE' else 0
        
        # Coherence score calculation with respect to previous response
        coherence_score = 0
        if len(self.conversations) > 1:  # Ensure there is a previous response to compare against
            previous_response = self.conversations[-2].input + self.conversations[-2].context # Get last response text
            
            # Combine previous and current responses and ensure they fit within model limits
            coherence_input = f"{previous_response} {response}"

             # Proper token counting and truncation
            tokens = self.tokenizer.encode(coherence_input)
            if len(tokens) > 512:  # Check token count (simple word count)
                coherence_input = self.tokenizer.decode(tokens[:500], skip_special_tokens=True)
            
            coherence_result = self.coherence_model(coherence_input)
            coherence_score = coherence_result[0]['score'] if coherence_result else 0
        
        # NER score (count number of entities recognized)
        ner_result = self.ner_model(response)
        ner_score = len(ner_result)

        total_score = sentiment_score + coherence_score + ner_score
        
        if is_human:
            self.human_score += total_score
            return total_score
        else:
            self.ai_score += total_score
            return total_score

    async def start_simulation(self):
        """Initialize a new simulation and return initial state"""
        self.conversations = []
        self.human_score = 0
        self.ai_score = 0
        
        # Create opening statement
        opening_statement = LawyerContext(
            input="The court is now in session.",
            context="The judge will now decide who presents first.",
            speaker="judge",
            score=0.0
        )
        
        # Add to conversation history
        self.conversations.append(opening_statement)

        # Randomly decide first turn
        self.current_turn = "human" if random.random() < 0.5 else "ai"
        
        # Create judge's first directive
        first_directive = LawyerContext(
            input=f"The {self.current_turn} lawyer will present first.",
            context="Please present your opening argument.",
            speaker="judge",
            score=0.0
        )
        
        # Add to conversation history
        self.conversations.append(first_directive)
        
        return TurnResponse(
            next_turn=self.current_turn,
            case_status="open",
            current_response=first_directive,
            human_score=0.0,
            ai_score=0.0
        )

    async def process_input(self, request: ProcessInputRequest):
        if request.turn_type != self.current_turn:
            raise HTTPException(status_code=400, detail="Not your turn to speak")

        # Process the input based on who's speaking
        if request.turn_type == "human":
            if not request.input_text:
                raise HTTPException(status_code=400, detail="Human input required")
            
            human_lawyer = HumanLawyer()
            response = human_lawyer.assistant.ask(request.input_text)
            score = self.analyze_response(response[1], is_human=True)
            
            # Create human's response
            human_response = LawyerContext(
                input=request.input_text,  # Show what human actually typed
                context=response[1],       # Show the context/analysis
                speaker="human",
                score=score
            )
            
            # Add human's response to conversation
            self.conversations.append(human_response)
            
            # Generate judge's commentary
            judge_comment = self.generate_judge_comment(human_response)
            self.conversations.append(judge_comment)

            # Check scores and determine next turn
            score_difference = abs(self.human_score - self.ai_score)
            if score_difference >= 25:
                return self.end_case()
            
            # Set next turn
            self.current_turn = "ai"
            
            # Return human's response first
            return TurnResponse(
                next_turn=self.current_turn,
                case_status="open",
                current_response=human_response,  # Return human's response
                human_score=self.human_score,
                ai_score=self.ai_score
            )
            
        else:  # AI turn
            ai_lawyer = AILawyer()
            ai_response_data = ai_lawyer.respond("Present your argument to the court")
            score = self.analyze_response(ai_response_data["context"], is_human=False)
            
            # Create AI's response
            ai_response = LawyerContext(
                input=ai_response_data["context"],  # Show AI's actual argument
                context="Based on legal precedent and case analysis",
                speaker="ai",
                score=score
            )
            
            # Add AI's response to conversation
            self.conversations.append(ai_response)
            
            # Generate judge's commentary
            judge_comment = self.generate_judge_comment(ai_response)
            self.conversations.append(judge_comment)

            # Check scores and determine next turn
            score_difference = abs(self.human_score - self.ai_score)
            if score_difference >= 25:
                return self.end_case()
            
            # Set next turn
            self.current_turn = "human"
            
            # Return AI's response first
            return TurnResponse(
                next_turn=self.current_turn,
                case_status="open",
                current_response=ai_response,  # Return AI's response
                human_score=self.human_score,
                ai_score=self.ai_score
            )

    def end_case(self):
        """Helper method to handle case ending"""
        winner = "Human Lawyer" if self.human_score > self.ai_score else "AI Lawyer"
        score_difference = abs(self.human_score - self.ai_score)
        
        closing_statement = self.generate_closing_statement(winner, score_difference)
        self.conversations.append(closing_statement)
        
        return TurnResponse(
            next_turn="none",
            case_status="closed",
            winner=winner,
            score_difference=score_difference,
            current_response=closing_statement,
            human_score=self.human_score,
            ai_score=self.ai_score
        )

    def generate_judge_comment(self, last_response: LawyerContext) -> LawyerContext:
        """Generate judge's commentary after each argument"""
        prompt = (
            "You are an experienced judge presiding over a case. "
            "Provide a brief comment on the last argument presented. "
            f"The {last_response.speaker} lawyer argued: {last_response.context}\n"
            "Give your reaction and direct the next lawyer to proceed."
        )

        client = OpenAI(
            base_url=self.llm_config["base_url"],
            api_key=self.llm_config["api_key"]
        )
        
        try:
            response = client.chat.completions.create(
                model=self.llm_config["model"],
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            comment = response.choices[0].message.content
            next_speaker = "AI" if self.current_turn == "ai" else "Human"
            
            return LawyerContext(
                input=comment,
                context=f"The {next_speaker} lawyer may now present their argument.",
                speaker="judge",
                score=0.0
            )
        except Exception as e:
            print(f"Error generating judge comment: {e}")
            return LawyerContext(
                input="The court acknowledges your argument.",
                context="Please proceed with the next argument.",
                speaker="judge",
                score=0.0
            )

    def generate_closing_statement(self, winner: str, score_difference: float) -> LawyerContext:
        """Generate judge's closing statement"""
        prompt = (
            "You are an experienced judge presiding over a case. "
            "Provide a brief closing statement based on the arguments presented. "
            f"Based on the arguments presented, the {winner} has presented a more compelling case. "
            f"The score difference is {score_difference:.2f} points."
        )

        client = OpenAI(
            base_url=self.llm_config["base_url"],
            api_key=self.llm_config["api_key"]
        )
        
        try:
            response = client.chat.completions.create(
                model=self.llm_config["model"],
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            return LawyerContext(
                input=response.choices[0].message.content,
                context="The court has reached a decision.",
                speaker="judge",
                score=0.0
            )
        except Exception as e:
            print(f"Error generating closing statement: {e}")
            return LawyerContext(
                input="The court has reached a decision.",
                context="Based on the arguments presented, the court has reached a decision.",
                speaker="judge",
                score=0.0
            )



#later will have to add a function which will basically take the covnersation and take the lists and then put it onto case pdf using the report pdf library function