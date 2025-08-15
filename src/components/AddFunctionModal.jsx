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

const AddFunctionModal = ({
  open,
  onClose,
  project,
  section,
  module,
  initialFunctions = [],
  onSave,
}) => {
  const [functions, setFunctions] = useState([""]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (open) {
      // Prefer parent-provided initialFunctions if available (keeps latest state after save)
      if (Array.isArray(initialFunctions) && initialFunctions.length > 0) {
        setFunctions(initialFunctions.map((f) => f.title || f));
        return;
      }

      // Otherwise fall back to database module.functions
      const dbFunctions = module?.functions;
      if (Array.isArray(dbFunctions) && dbFunctions.length > 0) {
        setFunctions(dbFunctions.map((f) => f.title));
      } else {
        setFunctions([""]);
      }
    }
  }, [open, module?.functions, initialFunctions]);

  const handleFunctionChange = (index, value) => {
    setFunctions((functions) =>
      functions.map((f, i) => (i === index ? value : f))
    );
  };

  const handleAddFunction = () =>
    setFunctions((functions) => [...functions, ""]);

  const handleRemoveFunction = (index) => {
    if (functions.length === 1) return;
    setFunctions((functions) => functions.filter((_, i) => i !== index));
  };

  const handleSaveFunctions = async () => {
    setSaveLoading(true);
    try {
      const token = getToken();
      const endpoint = `/api/projects/${project._id}/sections/${section._id}/modules/${module._id}/functions`;

      // Filter out empty functions and prepare data
      const validFunctions = functions.filter((title) => title.trim());
      if (validFunctions.length === 0) {
        setSnackbar({
          open: true,
          message: "At least one function is required",
          severity: "warning",
        });
        setSaveLoading(false);
        return;
      }

      const functionData = validFunctions.map((title) => ({
        title: title.trim(),
      }));

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ functions: functionData }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: "Functions saved successfully!",
          severity: "success",
        });
        setFunctions(validFunctions);
        if (onSave && data.functions) {
          onSave(data.functions);
        }
        onClose();
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to save functions",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error saving functions:", error);
      setSnackbar({
        open: true,
        message: "Error saving functions",
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
              Add Function
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {module?.title} | {section?.title} - {project?.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: "20px" }}>
          {functions.map((functionItem, idxno) => (
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
                label={`Function ${idxno + 1}`}
                variant="outlined"
                value={functionItem}
                onChange={(e) => handleFunctionChange(idxno, e.target.value)}
                sx={{ mt: 1 }}
              />
              {functions.length > 1 && (
                <IconButton
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => handleRemoveFunction(idxno)}
                  aria-label="Remove function"
                >
                  <RemoveCircleOutlineIcon />
                </IconButton>
              )}
            </Box>
          ))}
          <Button variant="outlined" onClick={handleAddFunction} sx={{ mt: 1 }}>
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
            Number of functions: {functions.length}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSaveFunctions}
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

export default AddFunctionModal;
