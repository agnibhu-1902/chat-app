import React from 'react'

const Avatar = ({ username, userId, online }) => {
    const colors = ['bg-red-200', 'bg-green-200', 'bg-purple-200', 'bg-blue-200', 'bg-yellow-200', 'bg-teal-200', 'bg-lime-200', 'bg-pink-200', 'bg-sky-200']
    const userIdBase10 = parseInt(userId, 16)
    const color = colors[userIdBase10 % colors.length]

  return (
    <div className={"w-10 h-10 rounded-full relative justify-center flex items-center " + color}>
        <span className='opacity-70'>{username[0]}</span>
        {online && (
            <div className='absolute w-3 h-3 bg-green-400 rounded-full top-0 right-0 shadow-md border border-white'></div>
        )}
        {!online && (
            <div className='absolute w-3 h-3 bg-gray-400 rounded-full top-0 right-0 shadow-md border border-white'></div>
        )}
    </div>
  )
}

export default Avatar