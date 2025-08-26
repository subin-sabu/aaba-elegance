import { useState } from 'react'
import './App.css'
import Login from './components/Login';


function App() {
  const [user, setUser] = useState(0);

  return (
    <>
    <div>{JSON.stringify(user) ?? "loading..."}</div>
    <Login setUser={setUser}/>
      
    </>
  )
}

export default App
