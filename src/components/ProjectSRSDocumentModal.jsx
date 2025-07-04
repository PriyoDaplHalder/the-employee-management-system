"use client";

import { useState, useEffect } from "react";
import { getToken } from "../utils/storage";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  IconButton,
  Divider,
  Alert,
  Chip,
  Link,
} from "@mui/material";
import CustomSnackbar from "./CustomSnackbar";
import {
  Close as CloseIcon,
  DocumentScanner as DocumentScannerIcon,
  Save as SaveIcon,
  Link as LinkIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";

const ProjectSRSDocumentModal = ({
  project,
  open,
  onClose,
  onSuccess,
  user,
}) => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [websiteLink, setWebsiteLink] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isManagement = user?.role === "management";
  const isEmployee = user?.role === "employee";

  useEffect(() => {
    if (open && project) {
      fetchSRSDocument();
    }
  }, [open, project]);

  const fetchSRSDocument = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/projects/${project._id}/srs-document`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExistingDocument(data.srsDocument);
        setWebsiteLink(data.srsDocument?.websiteLink || "");
      } else if (response.status !== 404) {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to fetch SRS document",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error fetching SRS document:", err);
      setSnackbar({
        open: true,
        message: "Error fetching SRS document",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: "File size should not exceed 10MB",
          severity: "error",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSave = async () => {
    if (!isManagement) {
      setSnackbar({
        open: true,
        message: "Only management can update SRS documents",
        severity: "error",
      });
      return;
    }

    setSaveLoading(true);
    try {
      const token = getToken();
      const formData = new FormData();

      formData.append("websiteLink", websiteLink);
      if (selectedFile) {
        formData.append("srsFile", selectedFile);
      }

      const response = await fetch(
        `/api/projects/${project._id}/srs-document`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExistingDocument(data.srsDocument);
        setSelectedFile(null);
        setSnackbar({
          open: true,
          message: "SRS document updated successfully!",
          severity: "success",
        });
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to update SRS document",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error saving SRS document:", err);
      setSnackbar({
        open: true,
        message: "Error saving SRS document",
        severity: "error",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!isManagement) {
      setSnackbar({
        open: true,
        message: "Only management can delete SRS documents",
        severity: "error",
      });
      return;
    }

    if (
      !window.confirm("Are you sure you want to delete the SRS document file?")
    ) {
      return;
    }

    setSaveLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/projects/${project._id}/srs-document`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExistingDocument(data.srsDocument);
        setSnackbar({
          open: true,
          message: "SRS document file deleted successfully!",
          severity: "success",
        });
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to delete SRS document file",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error deleting SRS document:", err);
      setSnackbar({
        open: true,
        message: "Error deleting SRS document",
        severity: "error",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `/api/projects/${project._id}/srs-document/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = existingDocument.fileName || "srs-document";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: errorData.error || "Failed to download file",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      setSnackbar({
        open: true,
        message: "Error downloading file",
        severity: "error",
      });
    }
  };

  const handleClose = () => {
    setWebsiteLink("");
    setSelectedFile(null);
    setExistingDocument(null);
    onClose();
  };

  if (!project) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
          },
        }}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <DocumentScannerIcon color="primary" />
            <Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                SRS Document
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {project.name}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Website Link Section */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: "grey.50" }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", fontWeight: 600 }}
                  >
                    SRS Document Website Link
                  </Typography>

                  {isManagement ? (
                    <TextField
                      label="Website Link (Optional)"
                      value={websiteLink}
                      onChange={(e) => setWebsiteLink(e.target.value)}
                      multiline
                      rows={1}
                      placeholder="https://example.com/srs-document"
                      disabled={saveLoading}
                      sx={{ mb: 2, width: "55vw" }}
                    />
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      {existingDocument?.websiteLink ? (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <LinkIcon fontSize="small" color="primary" />
                          <Link
                            href={existingDocument.websiteLink}
                            target="_blank"
                            rel="noopener noreferrer" // Security best practice said by ai
                            sx={{ fontWeight: 500 }}
                          >
                            View SRS Document Online
                          </Link>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No website link available
                        </Typography>
                      )}
                    </Box>
                  )}

                  {existingDocument?.websiteLink && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        icon={<VisibilityIcon />}
                        label="Link Available"
                        color="primary"
                        variant="outlined"
                        sx={{ pointerEvents: "none" }}
                        size="small"
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* File Upload/Download Section */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, bgcolor: "grey.50" }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", fontWeight: 600 }}
                  >
                    SRS Document File
                  </Typography>

                  {/* Existing File Display */}
                  {existingDocument?.fileName && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Current File:
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          border: "1px solid",
                          borderColor: "primary.main",
                          borderRadius: 2,
                          bgcolor: "primary.50",
                        }}
                      >
                        <DocumentScannerIcon color="primary" />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {existingDocument.fileName}
                          </Typography>
                          {existingDocument.uploadedAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Uploaded:{" "}
                              {new Date(
                                existingDocument.uploadedAt
                              ).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={handleDownloadFile}
                            title="Download file"
                          >
                            <DownloadIcon />
                          </IconButton>
                          {isManagement && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={handleDeleteFile}
                              disabled={saveLoading}
                              title="Delete file"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* File Upload (Management Only) */}
                  {isManagement && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {existingDocument?.fileName
                          ? "Replace File:"
                          : "Upload File:"}
                      </Typography>
                      <Box
                        sx={{
                          border: "2px dashed",
                          borderColor: selectedFile
                            ? "success.main"
                            : "grey.300",
                          borderRadius: 2,
                          width: "55vw",
                          p: 3,
                          textAlign: "center",
                          bgcolor: selectedFile ? "success.50" : "grey.50",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          document.getElementById("srs-file-input").click()
                        }
                      >
                        <input
                          id="srs-file-input"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.md"
                          onChange={handleFileSelect}
                          style={{ display: "none" }}
                          disabled={saveLoading}
                        />
                        <UploadIcon
                          sx={{
                            fontSize: 48,
                            color: selectedFile ? "success.main" : "grey.400",
                            mb: 1,
                          }}
                        />
                        <Typography variant="h6" gutterBottom>
                          {selectedFile
                            ? selectedFile.name
                            : "Select SRS Document"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Supported formats: PDF, DOC, DOCX, TXT, MD (Max 10MB)
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Employee View - No File */}
                  {isEmployee && !existingDocument?.fileName && (
                    <Alert severity="info">
                      No SRS document file has been uploaded for this project
                      yet.
                    </Alert>
                  )}
                </Paper>
              </Grid>

              {/* Role-based Information */}
              <Grid item xs={12}>
                <Alert severity={isManagement ? "info" : "warning"}>
                  {isManagement
                    ? "You can upload SRS documents and provide website links for this project."
                    : "You can view and download SRS documents but cannot modify them. Contact management for any changes."}
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            justifyContent: "space-between",
          }}
        >
          {isManagement && (
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saveLoading || (!selectedFile && !websiteLink)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              {saveLoading ? <CircularProgress size={20} /> : "Save Changes"}
            </Button>
          )}
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{ borderRadius: 2, ml: "auto" }}
          >
            Close
          </Button>
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

export default ProjectSRSDocumentModal;
