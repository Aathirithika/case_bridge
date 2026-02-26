import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect(token) {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return this.socket;
        }

        const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        this.socket = io(serverUrl, {
            auth: {
                token: token
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Socket.IO connected successfully');
            this.isConnected = true;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket.IO disconnected:', reason);
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error.message);
            this.isConnected = false;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            console.log('Socket.IO disconnected manually');
        }
    }

    joinCase(caseId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join_case', caseId);
            console.log(`Joined case room: ${caseId}`);
        }
    }

    leaveCase(caseId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave_case', caseId);
            console.log(`Left case room: ${caseId}`);
        }
    }

    sendTypingIndicator(caseId, isTyping) {
        if (this.socket && this.isConnected) {
            this.socket.emit('typing', { caseId, isTyping });
        }
    }

    onNewMessage(callback) {
        if (this.socket) {
            this.socket.on('new_message', callback);
        }
    }

    onMessageRead(callback) {
        if (this.socket) {
            this.socket.on('message_read', callback);
        }
    }

    onUserTyping(callback) {
        if (this.socket) {
            this.socket.on('user_typing', callback);
        }
    }

    removeListener(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
