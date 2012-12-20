package proxy;

import java.io.IOException;
import java.net.ServerSocket;

/**
 * Yet another HTTP proxy server specialized for augmenting the experience of <a href="http://otoge.net/">otoge.net</a>.
 * @author Jun KATO
 * @see <a href="http://www.jtmelton.com/2007/11/27/a-simple-multi-threaded-java-http-proxy-server/">A Simple Multi-Threaded Java HTTP Proxy Server</a>
 */
public class ProxyServer {
    public static void main(String[] args) throws IOException {
    	System.out.println("version 0.0.3");

    	ServerSocket serverSocket = null;
        boolean listening = true;

        int port = 10000;
        try {
            port = Integer.parseInt(args[0]);
        } catch (Exception e) {
        	// Use the default port.
        }

        try {
            serverSocket = new ServerSocket(port);
            System.out.println("Started on: " + port);
        } catch (IOException e) {
            System.err.println("Could not listen on port: " + args[0]);
            System.exit(-1);
        }

        while (listening) {
            new ProxyThread(serverSocket.accept()).start();
        }
        serverSocket.close();
    }
}