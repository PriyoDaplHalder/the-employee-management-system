import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  TextField,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
} from "@mui/icons-material";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";

const FunctionDescriptionsModal = ({ open, onClose, project, section, module, functionItem, onSave }) => {
  const [descriptions, setDescriptions] = useState([""]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (open && functionItem) {
      // Always populate from database if available
      const dbDescriptions = functionItem?.descriptions;
      setDescriptions(Array.isArray(dbDescriptions) && dbDescriptions.length > 0 ? dbDescriptions.map(d => d.content) : [""]);
    }
  }, [open, functionItem]);

  const handleDescriptionChange = (index, value) => {
    setDescriptions(descriptions => descriptions.map((d, i) => (i === index ? value : d)));
  };

  const handleAddDescription = () => setDescriptions(descriptions => [...descriptions, ""]);

  const handleRemoveDescription = index => {
    if (descriptions.length === 1) return;
    setDescriptions(descriptions => descriptions.filter((_, i) => i !== index));
  };

  const handleSaveDescriptions = async () => {
    setSaveLoading(true);
    try {
      const token = getToken();
      const endpoint = `/api/projects/${project._id}/sections/${section._id}/modules/${module._id}/functions/${functionItem._id}/descriptions`;
      const descriptionData = descriptions.filter(content => content.trim()).map(content => ({ content: content.trim() }));
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ descriptions: descriptionData }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({ open: true, message: "Descriptions saved successfully!", severity: "success" });
        setDescriptions(descriptionData.map(d => d.content));
        if (onSave) {
          onSave();
        }
        onClose();
      } else {
        const errorData = await response.json();
        setSnackbar({ open: true, message: errorData.error || "Failed to save descriptions", severity: "error" });
      }
    } catch {
      setSnackbar({ open: true, message: "Error saving descriptions", severity: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: "90vh" } }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {functionItem?.title} - Descriptions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {module?.title} | {section?.title} - {project?.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 1 }}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
              Function Description
               {/* ({descriptions.filter(d => d.trim()).length}) */}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddDescription}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Add Description
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {descriptions.map((description, index) => (
              <Card key={index} sx={{ bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200" }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <DescriptionIcon color="action" sx={{ mt: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={`Description ${index + 1}`}
                        variant="outlined"
                        value={description}
                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                        placeholder="Enter function description..."
                      />
                    </Box>
                    {descriptions.length > 1 && (
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveDescription(index)}
                        aria-label="Remove description"
                        sx={{ mt: 1 }}
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {descriptions.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <DescriptionIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No descriptions added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add descriptions to detail what this function does.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Number of descriptions: {descriptions.filter(d => d.trim()).length}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSaveDescriptions}
              disabled={saveLoading}
            >
              {saveLoading ? "Saving..." : "Save"}
            </Button>
            <Button onClick={onClose} variant="outlined">
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </>
  );
};

export default FunctionDescriptionsModal;
