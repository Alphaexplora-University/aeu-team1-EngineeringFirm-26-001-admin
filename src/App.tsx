import { Routes, Route } from "react-router"
import LoginPage from "./view/LoginPage"
import AdminPage from "./view/AdminPage"

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
