import React from 'react'

const Input = ({ label, type = 'text', value, onChange, name, placeholder }) => {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 bg-blue-100 block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
    </label>
  )
}

export default Input
