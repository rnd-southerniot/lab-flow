import socket

def get_available_port(start_port: int = 8000, host: str = "") -> int:
    """
    Finds the next available port on the given host starting from start_port.
    """
    port = start_port
    while port <= 65535:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, port))
                return port
            except (socket.error, PermissionError):
                port += 1
    
    raise IOError(f"No available ports found starting from {start_port}")
