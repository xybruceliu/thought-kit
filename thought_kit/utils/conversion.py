"""
Conversion utilities for ThoughtKit.

This module centralizes all JSON conversion logic for the ThoughtKit schemas,
simplifying the process of converting between JSON and model objects.
"""

from typing import Dict, List, Union, Any, Optional, Type, TypeVar
import json
from datetime import datetime
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def to_json(model: Union[BaseModel, List[BaseModel]], as_string: bool = True, 
            return_model: bool = False) -> Union[str, Dict[str, Any], List[Dict[str, Any]], BaseModel, List[BaseModel]]:
    """
    Convert any Pydantic model or list of models to JSON.
    
    Args:
        model: The Pydantic model or list of models to convert
        as_string: Whether to return a JSON string (True) or dict/list of dicts (False)
        return_model: If True and as_string is False, returns the original model instead of a dict
        
    Returns:
        The model(s) as JSON string, dict/list of dicts, or original model(s)
    """

    # If return_model is True and as_string is False, return the original model instead of a dict
    if return_model and not as_string:
        return model

    # Handle list of models
    if isinstance(model, list):
        json_list = [item.model_dump() for item in model]
        return json.dumps(json_list, cls=DateTimeEncoder) if as_string else json_list
    
    # Handle single model
    json_dict = model.model_dump()
    return json.dumps(json_dict, cls=DateTimeEncoder) if as_string else json_dict


def from_json(json_data: Union[str, Dict[str, Any]], model_class: Type[T]) -> T:
    """
    Convert JSON to a Pydantic model.
    
    Args:
        json_data: The JSON data as string or dict
        model_class: The target Pydantic model class
        
    Returns:
        An instance of the specified model class
    """
    if isinstance(json_data, str):
        data_dict = json.loads(json_data)
    else:
        data_dict = json_data
    
    return model_class.model_validate(data_dict) 