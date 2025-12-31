import net from 'net';

/**
 * Finds the next available port on the given host starting from startPort.
 * This is useful for avoiding EADDRINUSE errors during development.
 * 
 * @param startPort The port to start checking from (default 3000)
 * @param host The hostname to check (default '127.0.0.1')
 * @returns A promise that resolves to the first available port
 */
export async function getAvailablePort(startPort: number = 3000, host: string = '0.0.0.0'): Promise<number> {
    const isPortAvailable = (port: number): Promise<boolean> => {
        return new Promise((resolve) => {
            const server = net.createServer();

            server.once('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false);
                } else {
                    // Other errors might mean we can't use this port anyway
                    resolve(false);
                }
            });

            server.once('listening', () => {
                server.close();
                resolve(true);
            });

            try {
                server.listen(port, host);
            } catch (e) {
                resolve(false);
            }
        });
    };

    let port = startPort;
    while (port <= 65535) {
        if (await isPortAvailable(port)) {
            return port;
        }
        port++;
    }

    throw new Error(`No available ports found starting from ${startPort}`);
}

// Example usage (uncomment if running directly with ts-node):
// getAvailablePort(3000).then(port => console.log(`Available port: ${port}`));
