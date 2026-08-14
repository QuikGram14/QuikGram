import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'

let socket: Socket | null = null

export const connectSocket = (token: string) => {
  if (socket?.connected) return socket

  socket = io(WS_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('WebSocket connected')
  })

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected')
  })

  socket.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket

export const sendMessage = (chatId: string, content: string, encrypted?: string) => {
  if (!socket) return

  socket.emit('sendMessage', {
    chatId,
    content,
    encrypted,
  })
}

export const joinChat = (chatId: string) => {
  if (!socket) return
  socket.emit('joinChat', { chatId })
}

export const leaveChat = (chatId: string) => {
  if (!socket) return
  socket.emit('leaveChat', { chatId })
}

export const notifyTyping = (chatId: string, isTyping: boolean) => {
  if (!socket) return
  socket.emit('userTyping', { chatId, isTyping })
}
