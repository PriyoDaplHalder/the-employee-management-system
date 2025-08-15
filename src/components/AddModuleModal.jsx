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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";

const AddModuleModal = ({ open, onClose, project, section, onSave }) => {
  const [modules, setModules] = useState([""]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (open) {
      // Always populate from database if available
      const dbModules = section?.modules;
      if (Array.isArray(dbModules) && dbModules.length > 0) {
        setModules(dbModules.map((m) => m.title));
      } else {
        setModules([""]);
      }
    }
  }, [open, section?.modules]);

  const handleModuleChange = (index, value) => {
    setModules((modules) => modules.map((m, i) => (i === index ? value : m)));
  };

  const handleAddModule = () => setModules((modules) => [...modules, ""]);

  const handleRemoveModule = (index) => {
    if (modules.length === 1) return;
    setModules((modules) => modules.filter((_, i) => i !== index));
  };

  const handleSaveModules = async () => {
    setSaveLoading(true);
    try {
      const token = getToken();
      const endpoint = `/api/projects/${project._id}/sections/${section._id}/modules`;

      // Filter out empty modules and prepare data
      const validModules = modules.filter((title) => title.trim());
      if (validModules.length === 0) {
        setSnackbar({
          open: true,
          message: "At least one module is required",
          severity: "warning",
        });
        setSaveLoading(false);
        return;
      }

      const moduleData = validModules.map((title) => ({ title: title.trim() }));

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modules: moduleData }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: "Modules saved successfully!",
          severity: "success",
        });
        setModules(validModules);
        if (onSave && data.modules) {
          onSave(data.modules);
        }
        onClose();
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to save modules",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error saving modules:", error);
      setSnackbar({
        open: true,
        message: "Error saving modules",
        severity: "error",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
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
              Add Module
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {section?.title} - {project?.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: "20px" }}>
          {modules.map((module, idxno) => (
            <Box
              key={idxno}
              sx={{
                mb: 2,
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <TextField
                fullWidth
                label={`Module ${idxno + 1}`}
                variant="outlined"
                value={module}
                onChange={(e) => handleModuleChange(idxno, e.target.value)}
                sx={{ mt: 1 }}
              />
              {modules.length > 1 && (
                <IconButton
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => handleRemoveModule(idxno)}
                  aria-label="Remove module"
                >
                  <RemoveCircleOutlineIcon />
                </IconButton>
              )}
            </Box>
          ))}
          <Button variant="outlined" onClick={handleAddModule} sx={{ mt: 1 }}>
            Add another
          </Button>
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
            Number of modules: {modules.length}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSaveModules}
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

export default AddModuleModal;
