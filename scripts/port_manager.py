import socket
import sys

def get_available_port(start_port: int = 8000, host: str = "") -> int:
    """
    Finds the next available port on the given host starting from start_port.
    Iterates through ports until a free one is found or 65535 is reached.
    """
    port = start_port
    while port <= 65535:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                # Try to bind to the port. If it succeeds, the port is free.
                s.bind((host, port))
                return port
            except (socket.error, PermissionError):
                # Port is already in use or permission denied, try the next one.
                port += 1
    
    raise IOError(f"No available ports found starting from {start_port} up to 65535")

if __name__ == "__main__":
    # If run as a script, it takes the start port as an argument and prints the next available one.
    # Example: python scripts/port_manager.py 8000
    try:
        start = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
        print(get_available_port(start))
    except (ValueError, IOError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
