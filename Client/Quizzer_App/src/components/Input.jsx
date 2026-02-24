import React from 'react'

const Input = ({ label, type = 'text', value, onChange, name, placeholder, min, max }) => {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  )
}

export default Input
