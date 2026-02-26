import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    File as FileIcon,
    Upload,
    Download,
    Paperclip,
    Check,
    CheckCheck,
    Loader
} from 'lucide-react';
import api from '../utils/axiosConfig';
import socketService from '../utils/socketService';

export default function ChatMessaging({ caseId, currentUser, recipientUser, isOpen, onClose, hideHeader = false, standalone = false }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Socket.IO and fetch messages
    useEffect(() => {
        if (!isOpen || !caseId) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Connect socket
        socketService.connect(token);
        socketService.joinCase(caseId);

        // Fetch existing messages
        fetchMessages();

        // Listen for new messages
        const handleNewMessage = (message) => {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });

            // Mark as read if received from other user
            if (message.receiver._id === currentUser._id) {
                markAsRead(message._id);
            }
        };

        const handleMessageRead = ({ messageId, readAt }) => {
            setMessages(prev =>
                prev.map(m =>
                    m._id === messageId
                        ? { ...m, readStatus: true, readAt }
                        : m
                )
            );
        };

        const handleUserTyping = ({ userId, isTyping }) => {
            if (userId !== currentUser._id) {
                setIsTyping(isTyping);
            }
        };

        socketService.onNewMessage(handleNewMessage);
        socketService.onMessageRead(handleMessageRead);
        socketService.onUserTyping(handleUserTyping);

        return () => {
            socketService.leaveCase(caseId);
            socketService.removeListener('new_message', handleNewMessage);
            socketService.removeListener('message_read', handleMessageRead);
            socketService.removeListener('user_typing', handleUserTyping);
        };
    }, [isOpen, caseId, currentUser]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get(`/api/messages/case/${caseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data.messages);

            // Mark all unread messages as read
            const unreadMessages = response.data.messages.filter(
                m => m.receiver._id === currentUser._id && !m.readStatus
            );
            unreadMessages.forEach(m => markAsRead(m._id));
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(`/api/messages/${messageId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        const isDocument = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

        if (!isValidSize) {
            alert(`${file.name} is too large. Max size is 5MB.`);
            return;
        }
        if (!isImage && !isDocument) {
            alert(`${file.name} is not a supported file type.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedFile({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result
            });
        };
        reader.readAsDataURL(file);
    };

    const removeFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !uploadedFile) || sending) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');

            // Defensive check for receiver ID (handles both object and string)
            const receiverId = recipientUser?._id || recipientUser;

            if (!receiverId) {
                alert('Connection error: Recipient information is missing.');
                return;
            }

            const messageData = {
                caseId,
                receiverId,
                messageType: uploadedFile ? 'file' : 'text',
                content: newMessage.trim() || `Sent a file: ${uploadedFile?.name}`,
                fileName: uploadedFile?.name,
                fileUrl: uploadedFile?.data,
                fileSize: uploadedFile?.size
            };

            await api.post('/api/messages', messageData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNewMessage('');
            setUploadedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        // Send typing indicator
        socketService.sendTypingIndicator(caseId, true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            socketService.sendTypingIndicator(caseId, false);
        }, 1000);
    };

    const formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const diffMs = now - msgDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return msgDate.toLocaleDateString();
    };

    if (!isOpen) return null;

    const chatContent = (
        <div className={`flex flex-col bg-white overflow-hidden ${standalone ? 'h-full w-full' : 'h-[80vh] w-full max-w-2xl rounded-3xl shadow-2xl'}`}>
            {/* Header */}
            {!hideHeader && (
                <div className="bg-gradient-to-r from-amber-700 to-stone-700 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">
                            {currentUser.role === 'client' ? 'Advoc. ' : ''}{recipientUser?.name || 'User'}
                        </h3>
                        <p className="text-xs text-amber-100">
                            {isTyping ? 'Typing...' : 'Online'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader className="w-8 h-8 text-amber-700 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                            <FileIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-bold text-stone-600">Start the conversation</p>
                        <p className="text-sm mb-6">Send a message to discuss your case details or share relevant documents.</p>
                        <button
                            onClick={() => setNewMessage("Hello, I would like to discuss my case details.")}
                            className="px-6 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold hover:bg-amber-100 transition-all active:scale-95"
                        >
                            Say Hello 👋
                        </button>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isSent = msg.sender._id === currentUser._id;
                        return (
                            <div
                                key={msg._id}
                                className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`max-w-[85%] md:max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {/* Message bubble */}
                                    <div
                                        className={`px-4 py-3 rounded-2xl shadow-sm ${isSent
                                            ? 'bg-gradient-to-br from-amber-700 to-stone-700 text-white rounded-br-none'
                                            : 'bg-white border border-amber-200 text-stone-900 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.messageType === 'file' ? (
                                            <div>
                                                {msg.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <div className="group relative">
                                                        <img
                                                            src={msg.fileUrl}
                                                            alt={msg.fileName}
                                                            className="w-full max-w-sm rounded-lg mb-2 shadow-inner"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                            <a href={msg.fileUrl} download={msg.fileName} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40">
                                                                <Download className="w-5 h-5" />
                                                            </a>
                                                        </div>
                                                        {msg.content && !msg.content.startsWith('Sent a file:') && (
                                                            <p className="text-sm mt-1">{msg.content}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={`flex items-center gap-3 p-1 rounded-xl transition-colors ${isSent ? 'hover:bg-white/10' : 'hover:bg-amber-50'}`}>
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isSent ? 'bg-white/20' : 'bg-amber-50'}`}>
                                                            <FileIcon className={`w-5 h-5 ${isSent ? 'text-white' : 'text-amber-700'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate">{msg.fileName}</p>
                                                            <p className={`text-[10px] uppercase font-black ${isSent ? 'text-amber-100' : 'text-stone-400'}`}>
                                                                {(msg.fileSize / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={msg.fileUrl}
                                                            download={msg.fileName}
                                                            className={`p-2 rounded-lg transition-all ${isSent ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-500'}`}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>

                                    {/* Timestamp and read status */}
                                    <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">{formatTime(msg.createdAt)}</span>
                                        {isSent && (
                                            msg.readStatus ? (
                                                <CheckCheck className="w-3.5 h-3.5 text-amber-600" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5 text-stone-300" />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {uploadedFile && (
                <div className="px-6 py-4 bg-white/50 backdrop-blur-md border-t border-amber-100">
                    <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-amber-100 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                        {uploadedFile.type.startsWith('image/') ? (
                            <img src={uploadedFile.data} alt="Preview" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                        ) : (
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                                <FileIcon className="w-6 h-6 text-amber-700" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-stone-900 truncate">{uploadedFile.name}</p>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-gray-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className={`p-4 bg-white border-t border-stone-100 ${standalone ? '' : 'rounded-b-3xl'}`}>
                <div className="flex items-end gap-3 bg-stone-50 p-2 rounded-2xl border border-transparent focus-within:border-amber-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-50/50 transition-all">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-white text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <textarea
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder="Discuss your case..."
                        className="flex-1 px-4 py-3 bg-transparent rounded-xl focus:outline-none resize-none text-sm font-medium leading-relaxed"
                        rows="1"
                        style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !uploadedFile) || sending}
                        className="p-3 bg-gradient-to-br from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 disabled:opacity-30 disabled:scale-100 text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[48px]"
                    >
                        {sending ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );

    return standalone ? chatContent : (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            {chatContent}
        </div>
    );
}
