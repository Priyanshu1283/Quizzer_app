import React from 'react'

const Input = ({ label, type = 'text', value, onChange, name, placeholder, min, max, className = '', disabled, readOnly }) => {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">{label}</span>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      />
    </label>
  )
}

export default Input
