"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  TextField,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { getToken } from "../utils/storage";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CustomSnackbar from "./CustomSnackbar";

const ConfirmationModal = ({ open, onClose, onConfirm, title, message }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="outlined">
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const AddDocumentModal = ({ open, onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({ title: "", description: "", file: null });
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Document</DialogTitle>
      <DialogContent>
        <TextField
          label="Title"
          fullWidth
          sx={{ my: 1 }}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <TextField
          label="Description"
          fullWidth
          sx={{ my: 1 }}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="file"
          onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit(form)}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EditDocumentModal = ({
  open,
  onClose,
  onSubmit,
  loading,
  form,
  setForm,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Edit Document</DialogTitle>
    <DialogContent>
      <TextField
        label="Title"
        fullWidth
        sx={{ my: 1 }}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <TextField
        label="Description"
        fullWidth
        sx={{ my: 1 }}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="outlined">
        Cancel
      </Button>
      <Button onClick={onSubmit} variant="contained" disabled={loading}>
        {loading ? <CircularProgress size={20} /> : "Save"}
      </Button>
    </DialogActions>
  </Dialog>
);

const ProjectOtherDocumentModal = ({
  open,
  onClose,
  project,
  user,
  employeeViewOnly,
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isManagement = user?.role === "management";
  const isEmployee = user?.role === "employee";

  // Check if user is management or employee with editing permissions (per-project)
  const canEdit =
    !employeeViewOnly &&
    (isManagement ||
      (isEmployee &&
        permissions?.projectPermissions?.some((p) => {
          const hasPermission =
            (p.projectId === project?._id ||
              p.projectId === project?.id ||
              p.projectId?.toString() === project?._id?.toString()) &&
            p.canEditOtherDocs === true;

          if (hasPermission) {
            console.log(
              "Found Other Docs permission for project:",
              project?.name,
              p
            );
          }
          return hasPermission;
        })));

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
    if (open && project) fetchDocuments();
  }, [open, project]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = getToken();
      // Use appropriate API endpoint based on user role
      const endpoint = isManagement
        ? `/api/projects/${project._id}/other-documents`
        : `/api/employee/projects/${project._id}/other-documents`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDocuments(data.documents);
      else setSnackbar({ open: true, message: data.error, severity: "error" });
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Failed to fetch documents",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async (form) => {
    if (!canEdit) {
      setSnackbar({
        open: true,
        message: "You don't have permission to upload documents",
        severity: "error",
      });
      return;
    }

    if (!form.title || !form.file) {
      setSnackbar({
        open: true,
        message: "Title and file required",
        severity: "error",
      });
      return;
    }
    setAddLoading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("file", form.file);

      // Use appropriate API endpoint based on user role and permissions
      const endpoint = isManagement
        ? `/api/projects/${project._id}/other-documents`
        : `/api/employee/projects/${project._id}/other-documents/edit`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const successMessage = isManagement
          ? "File uploaded successfully!"
          : "File uploaded successfully using your editing permissions!";
        setSnackbar({
          open: true,
          message: data.message || successMessage,
          severity: "success",
        });
        setShowAddModal(false);
        fetchDocuments();
      } else {
        setSnackbar({ open: true, message: data.error, severity: "error" });
      }
    } catch (e) {
      setSnackbar({ open: true, message: "Upload failed", severity: "error" });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      setSnackbar({
        open: true,
        message: "You don't have permission to delete documents",
        severity: "error",
      });
      return;
    }

    if (!deleteDoc) return;
    setDeleteLoading(true);
    try {
      const token = getToken();

      // Use appropriate API endpoint based on user role and permissions
      const endpoint = isManagement
        ? `/api/projects/${project._id}/other-documents?docId=${deleteDoc._id}`
        : `/api/employee/projects/${project._id}/other-documents/edit?docId=${deleteDoc._id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const successMessage = isManagement
          ? "Document deleted successfully"
          : "Document deleted successfully using your editing permissions!";
        setSnackbar({
          open: true,
          message: data.message || successMessage,
          severity: "success",
        });
        setDeleteDoc(null);
        setDocuments((prevDocs) =>
          prevDocs.filter((doc) => doc._id !== deleteDoc._id)
        );
        fetchDocuments();
      } else {
        setSnackbar({
          open: true,
          message: data.error || "Delete failed",
          severity: "error",
        });
      }
    } catch (e) {
      console.error("Delete error:", e);
      setSnackbar({ open: true, message: "Delete failed", severity: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (doc) => {
    setEditDoc(doc);
    setEditForm({ title: doc.title, description: doc.description });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!canEdit) {
      setSnackbar({
        open: true,
        message: "You don't have permission to edit documents",
        severity: "error",
      });
      return;
    }

    try {
      const token = getToken();

      // Use appropriate API endpoint based on user role and permissions
      const endpoint = isManagement
        ? `/api/projects/${project._id}/other-documents`
        : `/api/employee/projects/${project._id}/other-documents/edit`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ docId: editDoc._id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) {
        const successMessage = isManagement
          ? "Document updated successfully"
          : "Document updated successfully using your editing permissions!";
        setSnackbar({
          open: true,
          message: data.message || successMessage,
          severity: "success",
        });
        setEditDoc(null);
        setEditModalOpen(false);
        fetchDocuments();
      } else {
        setSnackbar({ open: true, message: data.error, severity: "error" });
      }
    } catch (e) {
      setSnackbar({ open: true, message: "Update failed", severity: "error" });
    }
  };

  const handleDownload = (doc) => {
    window.open(doc.filePath, "_blank");
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditDoc(null);
    setDeleteDoc(null);
    onClose();
  };

  if (!project) return null;

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
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
          <FileCopyIcon color="primary" />
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              Project Other Documents
            </Typography>
            <Typography variant="body2" component="span" color="text.secondary">
              {project.name}
              {isEmployee && !canEdit && (
                <Chip
                  label="View Only"
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
      </DialogTitle>
      {/* hello */}
      <DialogContent>
        <Box sx={{ p: 2 }}>
          {loading || (isEmployee && permissionsLoading) ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>
                {permissionsLoading
                  ? "Loading permissions..."
                  : "Loading Other Documents..."}
              </Typography>
            </Box>
          ) : (
            <>
              {canEdit && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddModal(true)}
                  variant="contained"
                  sx={{ mb: 2 }}
                >
                  Add Document
                </Button>
              )}
              {documents.length === 0 ? (
                <Typography>No other documents available.</Typography>
              ) : (
                documents.map((doc) => (
                  <Box
                    key={doc._id}
                    sx={{
                      mb: 2,
                      p: 2,
                      border: "1px solid #eee",
                      borderRadius: 2,
                      boxShadow: 3,
                      transition: "box-shadow 0.3s",
                      "&:hover": { boxShadow: 6 },
                    }}
                  >
                    <Typography variant="h6">{doc.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {doc.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {doc.fileName}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                      <Button
                        startIcon={<CloudDownloadIcon />}
                        onClick={() => handleDownload(doc)}
                        variant="contained"
                        size="small"
                      >
                        Download
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            startIcon={<EditIcon />}
                            onClick={() => handleEdit(doc)}
                            variant="outlined"
                            size="small"
                          >
                            Edit
                          </Button>
                          <Button
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteDoc(doc)}
                            color="error"
                            variant="outlined"
                            size="small"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </>
          )}
        </Box>
        {/* Add Document Modal */}
        {canEdit && (
          <AddDocumentModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddDocument}
            loading={addLoading}
          />
        )}
        {/* Delete Confirmation Modal */}
        {canEdit && (
          <ConfirmationModal
            open={!!deleteDoc}
            onClose={() => setDeleteDoc(null)}
            onConfirm={handleDelete}
            title="Delete Document"
            message={
              deleteDoc
                ? `Are you sure you want to delete '${deleteDoc.title}'?`
                : ""
            }
          />
        )}
        {/* Edit Document Modal */}
        {canEdit && (
          <EditDocumentModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditDoc(null);
            }}
            onSubmit={handleEditSave}
            loading={false}
            form={editForm}
            setForm={setEditForm}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseModal} variant="contained">
          Close
        </Button>
      </DialogActions>
      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Dialog>
  );
};

export default ProjectOtherDocumentModal;
