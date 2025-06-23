import React, { memo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import DynamicBoxField from './DynamicBoxField';

const DynamicBox = memo(({ 
  box, 
  editingBoxId, 
  setEditingBoxId, 
  updateBoxName, 
  addFieldToBox, 
  deleteBox, 
  updateFieldValue, 
  updateFieldLabel, 
  deleteField, 
  saveLoading 
}) => {
  return (
    <Grid item xs={12}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          {editingBoxId === box.id ? (
            <TextField
              variant="outlined"
              size="small"
              value={box.name}
              onChange={(e) => updateBoxName(box.id, e.target.value)}
              onBlur={() => setEditingBoxId(null)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setEditingBoxId(null);
                }
              }}
              autoFocus
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                {box.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setEditingBoxId(box.id)}
                disabled={saveLoading}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => addFieldToBox(box.id)}
              disabled={saveLoading}
              sx={{ borderRadius: 2 }}
            >
              Add Field
            </Button>
            <IconButton
              color="error"
              onClick={() => deleteBox(box.id)}
              disabled={saveLoading}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          {box.fields.map((field) => (
            <DynamicBoxField
              key={field.id}
              field={field}
              boxId={box.id}
              updateFieldValue={updateFieldValue}
              updateFieldLabel={updateFieldLabel}
              deleteField={deleteField}
              saveLoading={saveLoading}
            />
          ))}
          {box.fields.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                No fields added yet. Click "Add Field" to create input fields.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Grid>
  );
});

DynamicBox.displayName = 'DynamicBox';

export default DynamicBox;
