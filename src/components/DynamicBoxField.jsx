import React, { memo, useState, useEffect } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  Grid,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const DynamicBoxField = memo(({ 
  field, 
  boxId, 
  updateFieldValue, 
  updateFieldLabel, 
  deleteField, 
  saveLoading 
}) => {
  const [localValue, setLocalValue] = useState(field.value);

  // Sync local value with prop when field.value changes
  useEffect(() => {
    setLocalValue(field.value);
  }, [field.value]);

  // Debounce the update to formData
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== field.value) {
        updateFieldValue(boxId, field.id, localValue);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localValue, boxId, field.id, field.value, updateFieldValue]);

  return (
    <Grid item xs={12} sm={6}>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        <TextField
          fullWidth
          label={field.label}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          disabled={saveLoading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    const newLabel = prompt("Enter new label:", field.label);
                    if (newLabel && newLabel.trim()) {
                      updateFieldLabel(boxId, field.id, newLabel.trim());
                    }
                  }}
                  disabled={saveLoading}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <IconButton
          color="error"
          onClick={() => deleteField(boxId, field.id)}
          disabled={saveLoading}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Grid>
  );
});

DynamicBoxField.displayName = 'DynamicBoxField';

export default DynamicBoxField;
