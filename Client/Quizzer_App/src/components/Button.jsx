import React from 'react'

const Button = ({ children, onClick, className = '', type = 'button', disabled }) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${className}`}>
      {children}
    </button>
  )
}

export default Button
