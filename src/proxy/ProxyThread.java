package proxy;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.Socket;
import java.net.URL;
import java.net.URLConnection;
import java.util.StringTokenizer;

public class ProxyThread extends Thread {
	private Socket socket = null;
	private String content = null;
	private static final int BUFFER_SIZE = 32768;
	private static final String JS_REMOTE = "http://otoge.net/js/otogePlayYouTube.js";
	private static final String JS_LOCAL = "./data/otogePlayYouTube.js";

	public ProxyThread(Socket socket) {
		super("ProxyThread");
		this.socket = socket;
		loadFile();
	}

	private void loadFile() {
		try {
			InputStreamReader reader = new InputStreamReader(
					new FileInputStream(JS_LOCAL), "UTF-8");
			BufferedReader br = new BufferedReader(reader);
			StringBuffer sb = new StringBuffer();
			String line;
			while ((line = br.readLine()) != null) {
				sb.append(line);
				sb.append("\n");
			}
			content = sb.toString();
			br.close();
			reader.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private void sendJsCore(DataOutputStream out) throws IOException {
		OutputStreamWriter osw = new OutputStreamWriter(out, "UTF-8");
		osw.write("HTTP/1.0 200\r\n");
		osw.write("Content-Type: text/javascript; encoding=utf-8\r\n\r\n");
		osw.write(content);
		osw.flush();
	}

	public void run() {
		try {
			DataOutputStream out = new DataOutputStream(
					socket.getOutputStream());
			BufferedReader in = new BufferedReader(new InputStreamReader(
					socket.getInputStream()));

			String inputLine;
			int count = 0;

			String urlToCall = "";
			while ((inputLine = in.readLine()) != null) {
				try {
					StringTokenizer tok = new StringTokenizer(inputLine);
					tok.nextToken();
				} catch (Exception e) {
					break;
				}

				if (count == 0) {
					String[] tokens = inputLine.split(" ");
					urlToCall = tokens[1];
					System.out.println("Request for : " + urlToCall);
				}

				count++;
			}

			if (JS_REMOTE.equals(urlToCall)) {
				sendJsCore(out);
			} else {
				bypass(urlToCall, out);
			}

			if (out != null) {
				out.close();
			}
			if (in != null) {
				in.close();
			}
			if (socket != null) {
				socket.close();
			}

		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private void bypass(String urlToCall, DataOutputStream out)
			throws IOException {
		BufferedReader br = null;
		InputStream is = null;
		try {
			URL url = new URL(urlToCall);
			URLConnection conn = url.openConnection();
			conn.setDoInput(true);
			conn.setDoOutput(false);

			if (((HttpURLConnection) conn).getContentLength() > 0) {
				try {
					is = conn.getInputStream();
					br = new BufferedReader(new InputStreamReader(is));
				} catch (IOException e) {
					e.printStackTrace();
				}
			}

			byte buffer[] = new byte[BUFFER_SIZE];
			int index = is.read(buffer, 0, BUFFER_SIZE);
			while (index != -1) {
				out.write(buffer, 0, index);
				index = is.read(buffer, 0, BUFFER_SIZE);
			}
			out.flush();
		} catch (Exception e) {
			out.writeBytes("");
			e.printStackTrace();
		} finally {
			if (br != null) {
				br.close();
			}
		}
	}
}