from setuptools import setup, find_packages

setup(
    name="thought_kit",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "pydantic>=2.0.0",
        "openai>=1.0.0",
        "spacy>=3.0.0",
        "fastapi>=0.104.1",
        "uvicorn>=0.23.2",
        "python-dotenv>=1.0.0",
        "httpx>=0.25.0",
    ],
    description="A modular toolkit for generating, manipulating, and articulating AI thoughts as an interactive modality in human-AI interaction",
    author="Bruce Liu",
    python_requires=">=3.8",
)
