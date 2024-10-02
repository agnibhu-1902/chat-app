import axios from 'axios'
import React, { useContext, useState } from 'react'
import { UserContext } from '../context/UserContext'

const RegisterAndLoginForm = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register')
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext)

    const handleSubmit = async event => {
      event.preventDefault()
      const endpoint = isLoginOrRegister === 'register' ? 'register' : 'login'
      const {data} = await axios.post(endpoint, {username, password})
      setLoggedInUsername(data.username)
      setId(data.id)
    }

  return (
    <div className='bg-blue-50 h-screen flex items-center'>
        <form onSubmit={handleSubmit} className='w-64 mx-auto mb-12'>
            <input type="text" value={username} name='username' onChange={e => setUsername(e.target.value)} placeholder='username' className='block w-full rounded-sm p-2 mb-2 border' />
            <input type="password" value={password} name='password' onChange={e => setPassword(e.target.value)} placeholder='password' className='block w-full rounded-sm p-2 mb-2 border' />
            <button type='submit' className='bg-blue-500 text-white block w-full rounded-sm p-2'>
              {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
            </button>
            <div className='text-center mt-2'>
              {isLoginOrRegister === 'register' && (
                <div>
                  Already a member?&nbsp;
                  <button className='text-blue-500' onClick={() => setIsLoginOrRegister('login')}>Login</button>
                </div>
              )}
              {isLoginOrRegister === 'login' && (
                <div>
                  Don't have an account?&nbsp;
                  <button className='text-blue-500' onClick={() => setIsLoginOrRegister('register')}>Register</button>
                </div>
              )}
            </div>
        </form>
    </div>
  )
}

export default RegisterAndLoginForm