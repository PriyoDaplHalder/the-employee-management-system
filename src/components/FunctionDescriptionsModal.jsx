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
  Card,
  CardContent,
} from "@mui/material";
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";
import NoSSR from "./NoSSR";
import QuillEditor from "./QuillEditor";

const FunctionDescriptionsModal = ({
  open,
  onClose,
  project,
  section,
  module,
  functionItem,
  onSave,
}) => {
  const [descriptions, setDescriptions] = useState([""]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (open && functionItem) {
      const dbDescriptions = functionItem?.descriptions;
      setDescriptions(
        Array.isArray(dbDescriptions) && dbDescriptions.length > 0
          ? dbDescriptions.map((d) => d.content)
          : [""]
      );
    }
  }, [open, functionItem]);

  const handleDescriptionChange = (index, value) => {
    setDescriptions((descriptions) =>
      descriptions.map((d, i) => (i === index ? value : d))
    );
  };

  const handleAddDescription = () =>
    setDescriptions((descriptions) => [...descriptions, ""]);

  const handleRemoveDescription = (index) => {
    if (descriptions.length === 1) return;
    setDescriptions((descriptions) =>
      descriptions.filter((_, i) => i !== index)
    );
  };

  const handleSaveDescriptions = async () => {
    setSaveLoading(true);
    try {
      const token = getToken();
      const endpoint = `/api/projects/${project._id}/sections/${section._id}/modules/${module._id}/functions/${functionItem._id}/descriptions`;
      const descriptionData = descriptions
        .map((content) => (content || "").trim())
        .filter((content) => content && content !== "<p><br></p>")
        .map((content) => ({ content }));

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ descriptions: descriptionData }),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Function descriptions saved successfully!",
          severity: "success",
        });
        if (onSave) onSave();
        setTimeout(() => onClose(), 1500);
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to save descriptions",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error saving descriptions: " + error.message,
        severity: "error",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClose = () => {
    setDescriptions([""]);
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (!functionItem) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: "90vh",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DescriptionIcon />
            <Typography variant="h6" component="span">
              Function Descriptions - {functionItem.name}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2, overflow: "auto" }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Project: {project?.name} → Section: {section?.name} → Module:{" "}
              {module?.name}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {descriptions.map((description, index) => (
              <Card key={index} elevation={2}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      Description
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {descriptions.length > 1 && (
                        <IconButton
                          onClick={() => handleRemoveDescription(index)}
                          size="small"
                          color="error"
                          title="Remove description"
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <NoSSR
                    fallback={
                      <Box
                        sx={{
                          height: "200px",
                          border: "1px solid #ccc",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "text.secondary",
                        }}
                      >
                        Loading editor...
                      </Box>
                    }
                  >
                    <QuillEditor
                      value={description}
                      onChange={(value) =>
                        handleDescriptionChange(index, value)
                      }
                      height="200px"
                      placeholder={`Enter description...`}
                    />
                  </NoSSR>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={saveLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDescriptions}
            disabled={saveLoading}
          >
            {saveLoading ? "Saving..." : "Save Descriptions"}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </>
  );
};

export default FunctionDescriptionsModal;
