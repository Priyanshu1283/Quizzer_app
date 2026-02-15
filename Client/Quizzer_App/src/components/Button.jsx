import React from 'react'

const Button = ({ children, onClick, className = '', type = 'button', disabled }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        'bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
        className
      }
    >
      {children}
    </button>
  )
}

export default Button
