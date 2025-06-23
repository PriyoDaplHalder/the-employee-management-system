import React, { memo, useState, useEffect } from 'react';
import { TextField } from '@mui/material';

const DebouncedTextField = memo(({ 
  value, 
  onChange, 
  debounceMs = 300,
  ...props 
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop when value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  return (
    <TextField
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
});

DebouncedTextField.displayName = 'DebouncedTextField';

export default DebouncedTextField;
