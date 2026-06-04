import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "") 
  : "http://localhost:5000";

class SocketService {
  private static instance: Socket | null = null;

  public static getInstance(): Socket {
    if (!SocketService.instance) {
      SocketService.instance = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: false, // We'll connect manually when the user logs in
      });
    }
    return SocketService.instance;
  }

  public static connect() {
    if (!SocketService.instance) {
      SocketService.getInstance();
    }
    SocketService.instance?.connect();
  }

  public static disconnect() {
    if (SocketService.instance) {
      SocketService.instance.disconnect();
    }
  }
}

export const socket = SocketService.getInstance();
export default SocketService;
