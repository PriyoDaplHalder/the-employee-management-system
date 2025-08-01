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
  const [permissions, setPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
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
  // Check if user is management or employee with editing permissions (per-project)
  const canEdit =
    isManagement ||
    (isEmployee &&
      permissions?.projectPermissions?.some(
        (p) =>
          (p.projectId === project?._id ||
            p.projectId === project?.id ||
            p.projectId?.toString() === project?._id?.toString()) &&
          p.canEditSRS === true
      ));

  // Fetch user permissions if employee
  useEffect(() => {
    if (isEmployee && open) {
      fetchPermissions();
    }
  }, [isEmployee, open]);

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const token = getToken();
      const response = await fetch("/api/employee/permissions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permission || null);
      } else {
        setPermissions(null);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissions(null);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    if (open && project) {
      fetchSRSDocument();
    }
  }, [open, project]);

  const fetchSRSDocument = async () => {
    setLoading(true);
    try {
      const token = getToken();
      // Use appropriate API endpoint based on user role
      const endpoint = isManagement
        ? `/api/projects/${project._id}/srs-document`
        : `/api/employee/projects/${project._id}/srs-document`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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
    if (!canEdit) {
      setSnackbar({
        open: true,
        message: "You don't have permission to update SRS documents",
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

      // Use appropriate API endpoint based on user role and permissions
      const endpoint = isManagement
        ? `/api/projects/${project._id}/srs-document`
        : `/api/employee/projects/${project._id}/srs-document/edit`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setExistingDocument(data.srsDocument);
        setSelectedFile(null);
        const successMessage = isManagement
          ? "SRS document updated successfully!"
          : "SRS document updated successfully using your editing permissions!";

        setSnackbar({
          open: true,
          message: successMessage,
          severity: "success",
        });

        // Refetch the data to ensure we have the latest version
        await fetchSRSDocument();

        if (onSuccess) onSuccess();

        // Close the modal after a short delay to allow user to see the success message
        setTimeout(() => {
          onClose();
        }, 1000);
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
    if (!canEdit) {
      setSnackbar({
        open: true,
        message: "You don't have permission to delete SRS documents",
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
      // Use management endpoint for delete as employee endpoint doesn't support DELETE method
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
              <Typography
                variant="body2"
                component="span"
                color="text.secondary"
              >
                {project.name} - {canEdit ? "Edit Mode" : "View Mode"}
                {isEmployee && !canEdit && (
                  <Chip
                    label="Read Only"
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                )}
                {isEmployee && canEdit && (
                  <Chip
                    label="Edit Access"
                    size="small"
                    color="success"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {loading || (isEmployee && permissionsLoading) ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                {permissionsLoading
                  ? "Loading permissions..."
                  : "Loading SRS document..."}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mt: 2 }}>
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

                  {canEdit ? (
                    <TextField
                      label="Website Link (Optional)"
                      value={websiteLink}
                      onChange={(e) => setWebsiteLink(e.target.value)}
                      multiline
                      rows={1}
                      placeholder="https://example.com/srs-document"
                      disabled={saveLoading}
                      sx={{ mb: 2, width: "50vw" }}
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
                            rel="noopener noreferrer" // Security best practice said by gpt
                            //noopener:	Prevents access to window.opener, protects against tabnabbing.
                            //noreferrer:	Removes Referer header, also implies noopener.
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
                          {canEdit && (
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

                  {/* File Upload (Edit Permission Required) */}
                  {canEdit && (
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
                          width: "50vw",
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

                  {/* Non-Edit View - No File */}
                  {!canEdit && !existingDocument?.fileName && (
                    <Alert severity="info">
                      No SRS document file has been uploaded for this project
                      yet.
                    </Alert>
                  )}
                </Paper>
              </Grid>

              {/* Role-based Information */}
              <Grid item xs={12}>
                <Alert severity={canEdit ? "info" : "warning"}>
                  {canEdit
                    ? isManagement
                      ? "You can upload SRS documents and provide website links for this project."
                      : "You have editing permissions and can upload SRS documents and provide website links for this project."
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
          {canEdit && (
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
