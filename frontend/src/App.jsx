import { useState } from 'react'
import './App.css'
import Login from './components/LoginWithGoogle';
import OtpForm from './components/OtpForm';


function App() {
  const [user, setUser] = useState(null);

  return (
    <>
    <div>{user?.name ?? "loading..."}</div>
    <OtpForm purpose="forgot-password"/>
    <OtpForm purpose="signup" />
    <Login setUser={setUser}/>
      
    </>
  )
}

export default App
