import axios from "axios";
import { createContext, useEffect, useState } from "react";


export const UserContext = createContext({})

const UserContextProvider = props => {
    const [username, setUsername] = useState(null)
    const [id, setId] = useState(null)
    const url = "http://localhost:4000"
    useEffect(() => {
        axios.get('/profile').then(response => {
            setUsername(response.data.username)
            setId(response.data.userId)
        })
    }, [])
    const contextValue = {
        username,
        setUsername,
        id,
        setId,
        url
    }
    return (
        <UserContext.Provider value={contextValue}>
            {props.children}
        </UserContext.Provider>
    )
}

export default UserContextProvider