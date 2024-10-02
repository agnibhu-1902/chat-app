import React, { useEffect, useState } from 'react'

const Chat = () => {
  const [ws, setWs] = useState(null)
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000')
    setWs(ws)
    ws.addEventListener('message', handleMessage)
  }, [])

  const showOnlinePeople = peopleArray => {
    const people = {}
    peopleArray.forEach(({userId, username}) => {
      people[userId] = username
    })
    console.log(people)
  }

  const handleMessage = e => {
    const messageData = JSON.parse(e.data)
    if ('online' in messageData)
      showOnlinePeople(messageData.online)
  }

  return (
    <div className='flex h-screen'>
        <div className='bg-white w-1/3'>Contacts</div>
        <div className='bg-blue-100 w-2/3 p-2 flex flex-col'>
          <div className='flex-grow'>Messages with selected person</div>
          <div className='flex gap-2'>
            <input type="text" placeholder='Type your message here' className='bg-white p-2 flex-grow outline-none rounded-sm' />
            <button className='bg-blue-500 text-white p-2 rounded-sm'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
            </button>
          </div>
        </div>
    </div>
  )
}

export default Chat