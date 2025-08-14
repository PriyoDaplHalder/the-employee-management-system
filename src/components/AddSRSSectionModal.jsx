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

const AddSRSSectionModal = ({ open, onClose, project, onSave }) => {
  const [sections, setSections] = useState([""]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (open) {
      // Always populate from database if available
      const dbSections = project?.srsDocument?.sections;
      setSections(Array.isArray(dbSections) && dbSections.length > 0 ? dbSections.map(s => s.title) : [""]);
    }
  }, [open]);

  const handleSectionChange = (index, value) => {
    setSections(sections => sections.map((s, i) => (i === index ? value : s)));
  };

  const handleAddSection = () => setSections(sections => [...sections, ""]);

  const handleRemoveSection = index => {
    if (sections.length === 1) return;
    setSections(sections => sections.filter((_, i) => i !== index));
  };

  const handleSaveSections = async () => {
    setSaveLoading(true);
    try {
      const token = getToken();
      const endpoint = `/api/projects/${project._id}/srs-document`;
      const sectionData = sections.filter(title => title.trim()).map(title => ({ title: title.trim() }));
      const formData = new FormData();
      formData.append("sections", JSON.stringify(sectionData));
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setSnackbar({ open: true, message: "Sections saved successfully!", severity: "success" });
        setSections(sectionData.map(s => s.title));
        if (onSave && data.srsDocument?.sections) {
          onSave(data.srsDocument.sections);
        }
        onClose();
      } else {
        const errorData = await response.json();
        setSnackbar({ open: true, message: errorData.error || "Failed to save sections", severity: "error" });
      }
    } catch {
      setSnackbar({ open: true, message: "Error saving sections", severity: "error" });
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
              Add Section
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project?.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: "20px" }}>
          {sections.map((section, idxno) => (
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
                label={`Section ${idxno + 1}`}
                variant="outlined"
                value={section}
                onChange={(e) => handleSectionChange(idxno, e.target.value)}
                sx={{ mt: 1 }}
              />
              {sections.length > 1 && (
                <IconButton
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => handleRemoveSection(idxno)}
                  aria-label="Remove section"
                >
                  <RemoveCircleOutlineIcon />
                </IconButton>
              )}
            </Box>
          ))}
          <Button variant="outlined" onClick={handleAddSection} sx={{ mt: 1 }}>
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
            Number of sections: {sections.length}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSaveSections}
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

export default AddSRSSectionModal;
