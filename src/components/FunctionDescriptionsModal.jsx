import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/icons-material";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";

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
  const editorsRef = useRef([]);
  const containersRef = useRef([]);
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

  useEffect(() => {
    descriptions.forEach((desc, idx) => {
      const container = containersRef.current[idx];
      if (!container) return;

      if (!editorsRef.current[idx]) {
        const toolbarOptions = [
          ["bold", "italic", "underline", "strike"],
          [{ header: [1, 2, 3, false] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link"],
        ];

        const editor = new Quill(container, {
          theme: "snow",
          modules: { toolbar: toolbarOptions },
        });

        try {
          if (desc && desc.trim()) {
            editor.clipboard.dangerouslyPasteHTML(desc);
          } else {
            editor.setText("");
          }
        } catch (e) {
          editor.setText(desc || "");
        }

        editor.on("text-change", () => {
          const editorElement = container.querySelector(".ql-editor");
          if (editorElement) {
            const html = editorElement.innerHTML;
            setDescriptions((prev) =>
              prev.map((p, i) => (i === idx ? html : p))
            );
          }
        });

        editorsRef.current[idx] = editor;
      } else {
        const editor = editorsRef.current[idx];
        const editorElement = container.querySelector(".ql-editor");
        const currentHtml = editorElement ? editorElement.innerHTML : "";
        if ((desc || "") !== (currentHtml || "")) {
          try {
            editor.clipboard.dangerouslyPasteHTML(desc || "");
          } catch (e) {
            editor.setText(desc || "");
          }
        }
      }
    });

    if (editorsRef.current.length > descriptions.length) {
      for (let i = descriptions.length; i < editorsRef.current.length; i++) {
        try {
          const ed = editorsRef.current[i];
          if (ed) {
            ed.off && ed.off();
          }
        } catch (e) {}
      }
      editorsRef.current.length = descriptions.length;
      containersRef.current.length = descriptions.length;
    }

    return () => {};
  }, [descriptions, open]);

  // Clean up editors when modal closes
  useEffect(() => {
    if (!open) {
      // Clean up all editors
      editorsRef.current.forEach((editor, index) => {
        if (editor) {
          try {
            editor.off && editor.off();
          } catch (e) {
            console.error("Error cleaning up editor:", e);
          }
        }
      });
      editorsRef.current = [];
      containersRef.current = [];
    }
  }, [open]);

  const handleDescriptionChange = (index, value) => {
    const editor = editorsRef.current[index];
    if (editor) {
      try {
        editor.clipboard.dangerouslyPasteHTML(value);
      } catch (e) {
        editor.setText(value);
      }
    }
    setDescriptions((descriptions) =>
      descriptions.map((d, i) => (i === index ? value : d))
    );
  };

  const handleAddDescription = () =>
    setDescriptions((descriptions) => [...descriptions, ""]);

  const handleRemoveDescription = (index) => {
    if (descriptions.length === 1) return;
    if (editorsRef.current[index]) {
      try {
        editorsRef.current[index].off && editorsRef.current[index].off();
      } catch (e) {}
      editorsRef.current.splice(index, 1);
    }
    containersRef.current.splice(index, 1);
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
        .map((content, idx) => {
          const container = containersRef.current[idx];
          let html = content;
          if (container) {
            const editorElement = container.querySelector(".ql-editor");
            if (editorElement) {
              html = editorElement.innerHTML;
            }
          }
          return (html || "").trim();
        })
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
        const data = await response.json();
        setSnackbar({
          open: true,
          message: "Descriptions saved successfully!",
          severity: "success",
        });
        setDescriptions(descriptionData.map((d) => d.content));
        if (onSave) {
          onSave();
        }
        onClose();
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to save descriptions",
          severity: "error",
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: "Error saving descriptions",
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
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, maxHeight: "90vh", overflow: "visible" },
        }}
        sx={{ overflow: "visible" }}
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

        <DialogContent sx={{ p: 3, overflow: "visible" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              my: 1,
            }}
          >
            <Typography
              variant="h6"
              color="primary.main"
              sx={{ fontWeight: 600 }}
            >
              Function Description
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {descriptions.map((description, index) => (
              <Card
                key={index}
                sx={{
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                  >
                    <DescriptionIcon color="action" sx={{ mt: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <div
                        ref={(el) => (containersRef.current[index] = el)}
                        className="quill-container"
                        style={{ minHeight: 120 }}
                        aria-label={`Description editor ${index + 1}`}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {descriptions.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <DescriptionIcon
                sx={{ fontSize: 48, color: "grey.400", mb: 2 }}
              />
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
            Number of descriptions:{" "}
            {descriptions.filter((d) => d.trim()).length}
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
