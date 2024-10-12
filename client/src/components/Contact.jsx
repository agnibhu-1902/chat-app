import React from 'react'
import Avatar from './Avatar'

const Contact = ({userId, username, selected, onClick, online}) => {
  return (
    <div
        onClick={() => onClick(userId)}
        key={userId}
        className={
            "border-b border-gray-100 flex items-center gap-2 cursor-pointer " +
            (selected ? "bg-blue-50" : "")
        }
        >
        {selected && (<div className="w-1 h-12 bg-blue-500 rounded-r-md"></div>)}
        <div className="flex items-center gap-2 py-2 pl-4">
            <Avatar username={username} userId={userId} online={online} />
            <span className="text-gray-600">{username}</span>
        </div>
    </div>
  )
}

export default Contact