import sys
from pathlib import Path

# Ensure this project's backend directory takes absolute priority in sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir in sys.path:
    sys.path.remove(backend_dir)
sys.path.insert(0, backend_dir)

# Remove any conflicting desktop paths from sys.path if present
sys.path = [p for p in sys.path if "3 project" not in p]
