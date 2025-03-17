"""
ThoughtOperator module for performing operations on thoughts.
"""

import os
import importlib
import inspect
from typing import Dict, Callable, List, Any, Optional
from thought_kit.schemas import Thought, Memory

class ThoughtOperator:
    """
    Operator class for performing operations on thoughts.
    Provides a registry for operations and a mechanism to execute them.
    """
    
    def __init__(self):
        """Initialize the ThoughtOperator with an empty operations registry."""
        # Maps operation names (strings) to callables (functions)
        self._operations: Dict[str, Callable] = {}
        
    def register_operation(self, name: str, func: Callable) -> None:
        """
        Register an operation under a given name.
        
        Args:
            name: Name of the operation
            func: Callable function that implements the operation
        """
        self._operations[name] = func
        
    def operate(self, operation_name: str, thoughts: List[Thought], memory: Memory = None, **kwargs) -> Any:
        """
        Run the registered operation with the given arguments.
        
        Args:
            operation_name: Name of the operation to run
            thoughts: List of thoughts to operate on
            memory: Memory object to use for the operation
            **kwargs: Keyword arguments to pass to the operation
            
        Returns:
            The result of the operation
            
        Raises:
            ValueError: If no operation with the given name is registered
        """
        if operation_name not in self._operations:
            raise ValueError(f"No operation named '{operation_name}' has been registered.")
        return self._operations[operation_name](thoughts, memory, **kwargs)
        
    def available_operations(self) -> List[str]:
        """
        Get a list of all available operations.
        
        Returns:
            List of operation names
        """
        return list(self._operations.keys())
        
    def load_operations(self, plugin_directory: Optional[str] = None) -> None:
        """
        Load operations from the specified directory.
        
        Args:
            plugin_directory: Directory containing plugin files.
                If None, uses the default plugins directory.
        """
        if plugin_directory is None:
            # Use the default plugins directory
            # Get the absolute path to the current file (operator.py)
            current_file = os.path.abspath(__file__)
            # Get the directory containing this file
            current_dir = os.path.dirname(current_file)
            # Construct the path to the plugins directory
            plugin_directory = os.path.join(current_dir, "plugins")
            
        if not os.path.exists(plugin_directory):
            print(f"Plugin directory not found: {plugin_directory}")
            return
            
        for file_name in os.listdir(plugin_directory):
            if file_name.endswith("_plugin.py"):
                module_name = file_name[:-3]  # strip .py
                operation_name = module_name.replace("_plugin", "")
                module_path = f"thought_kit.modules.ThoughtOperator.plugins.{module_name}"
                
                try:
                    mod = importlib.import_module(module_path)
                    
                    # Find functions that could be operations
                    for name, obj in inspect.getmembers(mod, inspect.isfunction):
                        # Check if the function takes a Thought as its first parameter
                        sig = inspect.signature(obj)
                        params = list(sig.parameters.values())
                        if params and params[0].annotation == List[Thought]:
                            # Use the function name as the operation name
                            self.register_operation(name, obj)
                            # print(f"Registered operation '{name}' from {module_name}")
                except ImportError as e:
                    print(f"Failed to import plugin {module_name}: {e}")
                except Exception as e:
                    print(f"Error loading plugin {module_name}: {e}")
