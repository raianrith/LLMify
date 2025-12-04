"""LLM Service - handles queries to OpenAI, Gemini, and Perplexity."""
import re
import time
from typing import Optional, List, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import numpy as np

from openai import OpenAI
import google.generativeai as genai

from .config import get_settings

settings = get_settings()

# Download NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
except Exception:
    pass

# Initialize sentiment analyzer
sia = SentimentIntensityAnalyzer()

# System prompt for LLMs
SYSTEM_PROMPT = "Provide a helpful answer to the user's query."


class LLMService:
    """Service for interacting with multiple LLMs."""
    
    def __init__(
        self,
        openai_model: str = "gpt-4o",
        gemini_model: str = "gemini-2.0-flash-exp",
        perplexity_model: str = "sonar"
    ):
        self.openai_model = openai_model
        self.gemini_model_name = gemini_model
        self.perplexity_model = perplexity_model
        
        # Initialize clients
        self.openai_client = None
        self.gemini_model = None
        self.perplexity_client = None
        
        if settings.openai_api_key:
            self.openai_client = OpenAI(api_key=settings.openai_api_key)
        
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_model = genai.GenerativeModel(gemini_model)
        
        if settings.perplexity_api_key:
            self.perplexity_client = OpenAI(
                api_key=settings.perplexity_api_key,
                base_url="https://api.perplexity.ai"
            )
    
    def get_openai_response(self, query: str, delay: float = 0.1) -> str:
        """Get response from OpenAI."""
        try:
            if not self.openai_client:
                return "ERROR: OpenAI API key not configured"
            
            if delay > 0:
                time.sleep(delay)
            
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": query}
                ]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"ERROR: {str(e)}"
    
    def get_gemini_response(self, query: str, delay: float = 0.1, max_retries: int = 3) -> str:
        """Get response from Gemini with retry logic."""
        if not self.gemini_model:
            return "ERROR: Gemini API key not configured"
        
        for attempt in range(max_retries):
            try:
                if delay > 0:
                    time.sleep(delay)
                
                response = self.gemini_model.generate_content(query)
                return response.candidates[0].content.parts[0].text.strip()
            except Exception as e:
                error_str = str(e)
                
                if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                    retry_delay = 60 * (attempt + 1)
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        continue
                    return f"ERROR: 429 Rate limit exceeded after {max_retries} attempts"
                
                return f"ERROR: {error_str}"
        
        return "ERROR: Failed to get Gemini response"
    
    def get_perplexity_response(self, query: str, delay: float = 0.1) -> str:
        """Get response from Perplexity."""
        try:
            if not self.perplexity_client:
                return "ERROR: Perplexity API key not configured"
            
            if delay > 0:
                time.sleep(delay)
            
            response = self.perplexity_client.chat.completions.create(
                model=self.perplexity_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": query}
                ]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"ERROR: {str(e)}"
    
    def process_single_query(
        self,
        query: str,
        source: str,
        delay: float = 0.1
    ) -> dict:
        """Process a single query with one LLM."""
        start_time = time.time()
        
        if source == "OpenAI":
            response = self.get_openai_response(query, delay)
        elif source == "Gemini":
            response = self.get_gemini_response(query, delay)
        elif source == "Perplexity":
            response = self.get_perplexity_response(query, delay)
        else:
            response = f"ERROR: Unknown source {source}"
        
        end_time = time.time()
        
        return {
            "query": query,
            "source": source,
            "response": response,
            "response_time": round(end_time - start_time, 2),
            "timestamp": datetime.now().isoformat()
        }
    
    def process_queries_parallel(
        self,
        queries: List[str],
        max_workers: int = 6,
        delay: float = 0.1,
        progress_callback=None
    ) -> List[dict]:
        """Process multiple queries across all LLMs in parallel."""
        all_tasks = []
        
        for query in queries:
            all_tasks.extend([
                (query, "OpenAI"),
                (query, "Gemini"),
                (query, "Perplexity")
            ])
        
        results = []
        total_tasks = len(all_tasks)
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_task = {
                executor.submit(
                    self.process_single_query, task[0], task[1], delay
                ): task
                for task in all_tasks
            }
            
            completed = 0
            for future in as_completed(future_to_task):
                result = future.result()
                results.append(result)
                completed += 1
                
                if progress_callback:
                    progress_callback(completed, total_tasks)
        
        return results


class AnalysisService:
    """Service for analyzing LLM responses."""
    
    def __init__(self, brand_name: str, competitors: List[dict], brand_aliases: str = None):
        """
        Initialize analysis service.
        
        Args:
            brand_name: Primary brand name to track
            competitors: List of dicts with 'name' and optional 'aliases' keys
                         e.g., [{"name": "Amazon", "aliases": "AWS,Amazon.com"}]
            brand_aliases: Comma-separated alternative brand names
        """
        self.brand_name = brand_name
        
        # Build list of all brand name variations to check
        self.brand_patterns = [brand_name.lower()]
        if brand_aliases:
            aliases = [a.strip().lower() for a in brand_aliases.split(",") if a.strip()]
            self.brand_patterns.extend(aliases)
        
        # Build competitor patterns: maps each pattern (including aliases) to the canonical name
        self.competitor_names = []  # List of canonical competitor names
        self.competitor_patterns = {}  # Maps lowercase pattern -> canonical name
        
        for comp in competitors:
            if isinstance(comp, dict):
                name = comp.get("name", "")
                aliases_str = comp.get("aliases", "")
            else:
                # Backward compatibility: if it's just a string
                name = comp
                aliases_str = ""
            
            if name:
                self.competitor_names.append(name)
                # Add the main name as a pattern
                self.competitor_patterns[name.lower()] = name
                # Add all aliases as patterns pointing to the canonical name
                if aliases_str:
                    for alias in aliases_str.split(","):
                        alias = alias.strip()
                        if alias:
                            self.competitor_patterns[alias.lower()] = name
    
    def _check_brand_mention(self, text: str) -> bool:
        """Check if any brand name variation is mentioned in text."""
        text_lower = str(text).lower()
        return any(pattern in text_lower for pattern in self.brand_patterns)
    
    @staticmethod
    def safe_sentence_tokenize(text: str) -> List[str]:
        """Safe sentence tokenization with fallback."""
        try:
            return nltk.sent_tokenize(str(text))
        except:
            sentences = re.split(r'[.!?]+', str(text))
            return [s.strip() for s in sentences if s.strip()]
    
    def analyze_position(self, text: str) -> Tuple[str, int, str]:
        """Analyze where in the response the brand appears."""
        if not text or str(text).startswith("ERROR"):
            return "Not Mentioned", 0, "N/A"
        
        text_str = str(text)
        sentences = self.safe_sentence_tokenize(text_str)
        total_sentences = len(sentences)
        
        if total_sentences == 0:
            return "Not Mentioned", 0, "N/A"
        
        for i, sentence in enumerate(sentences):
            sentence_lower = sentence.lower()
            if any(pattern in sentence_lower for pattern in self.brand_patterns):
                position_pct = (i + 1) / total_sentences
                if position_pct <= 0.33:
                    return "First Third", i + 1, f"{position_pct:.1%}"
                elif position_pct <= 0.66:
                    return "Middle Third", i + 1, f"{position_pct:.1%}"
                else:
                    return "Last Third", i + 1, f"{position_pct:.1%}"
        
        return "Not Mentioned", 0, "N/A"
    
    def analyze_context(self, text: str) -> Tuple[str, float, List[dict]]:
        """Analyze the context around brand mentions."""
        if not text or str(text).startswith("ERROR"):
            return "Not Mentioned", 0.0, []
        
        text_str = str(text)
        
        if not self._check_brand_mention(text_str):
            return "Not Mentioned", 0.0, []
        
        sentences = self.safe_sentence_tokenize(text_str)
        contexts = []
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(pattern in sentence_lower for pattern in self.brand_patterns):
                sentiment = sia.polarity_scores(sentence)
                if sentiment['compound'] >= 0.1:
                    context_type = "Positive"
                elif sentiment['compound'] <= -0.1:
                    context_type = "Negative"
                else:
                    context_type = "Neutral"
                
                contexts.append({
                    'sentence': sentence,
                    'sentiment': sentiment['compound'],
                    'context': context_type
                })
        
        if contexts:
            avg_sentiment = np.mean([c['sentiment'] for c in contexts])
            return contexts[0]['context'], float(avg_sentiment), contexts
        
        return "Neutral", 0.0, []
    
    def extract_competitors(self, text: str) -> Tuple[List[str], dict]:
        """Extract competitors from response with position tracking.
        
        Uses competitor_patterns to match both primary names and aliases,
        but returns the canonical competitor name.
        """
        if not text or str(text).startswith("ERROR"):
            return [], {}
        
        text_str = str(text)
        
        # Build pattern from all competitor patterns (names + aliases)
        all_patterns = list(self.competitor_patterns.keys())
        if not all_patterns:
            return [], {}
        
        pattern = re.compile(
            r'\b(' + '|'.join(re.escape(p) for p in all_patterns) + r')\b',
            flags=re.IGNORECASE
        )
        matches = pattern.finditer(text_str)
        
        found_competitors = []
        positions = {}
        
        sentences = self.safe_sentence_tokenize(text_str)
        
        for match in matches:
            matched_text = match.group(1).lower()
            # Map to canonical competitor name
            canonical_name = self.competitor_patterns.get(matched_text)
            
            if canonical_name and canonical_name not in found_competitors:
                found_competitors.append(canonical_name)
                
                # Find position using the matched text
                for i, sentence in enumerate(sentences):
                    if matched_text in sentence.lower():
                        positions[canonical_name] = i + 1
                        break
        
        return found_competitors, positions
    
    def extract_sources(self, text: str) -> List[str]:
        """Extract URLs from response."""
        if not text or str(text).startswith("ERROR"):
            return []
        
        return re.findall(r'https?://\S+', str(text))
    
    def analyze_response(self, query: str, source: str, response: str) -> dict:
        """Full analysis of a single response."""
        # Position analysis
        position, sentence_num, position_pct = self.analyze_position(response)
        
        # Context analysis
        context_type, sentiment, _ = self.analyze_context(response)
        
        # Competitor extraction
        competitors, _ = self.extract_competitors(response)
        
        # Source extraction
        sources = self.extract_sources(response)
        
        # Brand mentioned check - checks all brand name variations
        brand_mentioned = (
            self._check_brand_mention(response) and
            not str(response).startswith("ERROR")
        )
        
        # Branded query check - checks all brand name variations
        branded_query = self._check_brand_mention(query)
        
        # Brand URL cited - checks all brand name variations
        brand_url_cited = any(
            any(pattern in url.lower() for pattern in self.brand_patterns)
            for url in sources
        )
        
        return {
            "brand_mentioned": brand_mentioned,
            "brand_position": position,
            "brand_sentence_num": sentence_num,
            "brand_position_pct": position_pct,
            "context_type": context_type,
            "context_sentiment": sentiment,
            "competitors_found": ", ".join(competitors) if competitors else "",
            "sources_cited": ", ".join(sources) if sources else "",
            "brand_url_cited": brand_url_cited,
            "branded_query": branded_query
        }

