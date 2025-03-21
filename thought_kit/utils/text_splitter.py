"""Text splitting utilities using regular expressions instead of spaCy."""
from typing import List
import re

class SentenceSplitter:
    """Split text into sentences using regular expressions."""
    
    def __init__(self, model_name: str = None):
        """Initialize the regex-based sentence splitter.
        
        Args:
            model_name: Not used, kept for API compatibility
        """
        # Common abbreviations to avoid splitting at periods in them
        self.abbreviations = {
            'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'e.g.', 'i.e.',
            'etc.', 'vs.', 'fig.', 'st.', 'ave.', 'no.', 'inc.', 'ltd.', 'co.'
        }
        
        # Pattern for sentence splitting
        # This handles periods, question marks, and exclamation points as sentence boundaries
        # But excludes common abbreviations
        self.sentence_pattern = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s')
        
    def split_sentences(self, text: str) -> List[str]:
        """Split text into sentences using regex.
        
        Args:
            text: Text to split
            
        Returns:
            List of sentences
        """
        if not text:
            return []
        
        # Lower the text to check for abbreviations
        lower_text = text.lower()
        
        # Replace abbreviations temporarily to avoid splitting at them
        for abbr in self.abbreviations:
            if abbr in lower_text:
                # Create a unique replacement that won't interfere with sentence splitting
                # We use the index to make it unique
                replacement = f"__ABBR{abbr}__"
                # Replace only in the lower_text to find positions
                positions = [(m.start(), m.end()) for m in re.finditer(re.escape(abbr), lower_text)]
                
                # Replace in the original text preserving case
                for start, end in reversed(positions):  # Reverse to avoid offset issues
                    text = text[:start] + replacement + text[end:]
        
        # Split the text into sentences
        sentences = self.sentence_pattern.split(text)
        
        # Restore abbreviations
        for abbr in self.abbreviations:
            replacement = f"__ABBR{abbr}__"
            for i, sentence in enumerate(sentences):
                sentences[i] = sentence.replace(replacement, abbr)
        
        # Clean up and return
        return [sent.strip() for sent in sentences if sent.strip()]
    
    def split_paragraphs(self, text: str) -> List[str]:
        """Split text into paragraphs based on double newlines.
        
        Args:
            text: Text to split
            
        Returns:
            List of paragraphs
        """
        if not text:
            return []
        
        return [p.strip() for p in text.split("\n\n") if p.strip()]
    
    def split_text(self, text: str, by_paragraphs: bool = True) -> List[str]:
        """Split text into sentences and optionally paragraphs.
        
        Args:
            text: Text to split
            by_paragraphs: Whether to split by paragraphs first (default: True)
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        if by_paragraphs:
            # First split by paragraphs, then by sentences within each paragraph
            paragraphs = self.split_paragraphs(text)
            result = []
            for paragraph in paragraphs:
                result.extend(self.split_sentences(paragraph))
            return result
        else:
            # Just split by sentences
            return self.split_sentences(text)
