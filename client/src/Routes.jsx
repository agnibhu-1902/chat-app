import axios from 'axios'
import React from 'react'
import RegisterAndLoginForm from "./pages/RegisterAndLoginForm"
import { useContext } from 'react'
import { UserContext } from './context/UserContext'
import Chat from './pages/Chat'


const Routes = () => {
    const {username, url} = useContext(UserContext)
    axios.defaults.baseURL = url
    axios.defaults.withCredentials = true
    if (username)
        return (<Chat />)
  return (
    <div>
        <RegisterAndLoginForm />
    </div>
  )
}

export default Routes

