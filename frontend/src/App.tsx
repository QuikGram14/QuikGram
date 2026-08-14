import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Pages (будут созданы в следующих файлах)
const LoginPage = () => <div>Login Page</div>
const ChatPage = () => <div>Chat Page</div>
const ProfilePage = () => <div>Profile Page</div>

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chats" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<Navigate to="/chats" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
