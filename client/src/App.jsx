import UserContextProvider from './context/UserContext'
import Routes from './Routes'

function App() {
  return (
    <>
      <div>
        <UserContextProvider>
          <Routes />
        </UserContextProvider>
      </div>
    </>
  )
}

export default App
