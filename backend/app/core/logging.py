import os
import logging

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Configure logging system dynamically
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="[%(asctime)s] %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

def get_logger(name: str) -> logging.Logger:
    """Returns a configured logger with the specified hierarchical namespace."""
    return logging.getLogger(name)
