"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
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

  useEffect(() => {
    if (open && project) fetchDocuments();
  }, [open, project]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/projects/${project._id}/other-documents`, {
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
      const res = await fetch(`/api/projects/${project._id}/other-documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({
          open: true,
          message: "File uploaded",
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
    if (!deleteDoc) return;
    setDeleteLoading(true);
    try {
      const token = getToken();
      const res = await fetch(
        `/api/projects/${project._id}/other-documents?docId=${deleteDoc._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setSnackbar({ open: true, message: "Deleted", severity: "success" });
        setDeleteDoc(null);
        fetchDocuments();
      } else {
        setSnackbar({ open: true, message: data.error, severity: "error" });
      }
    } catch (e) {
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
    try {
      const token = getToken();
      const res = await fetch(`/api/projects/${project._id}/other-documents`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ docId: editDoc._id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({ open: true, message: "Updated", severity: "success" });
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
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Project Other Documents
          </Typography>
        </Box>
      </DialogTitle>
      {/* hello */}
      <DialogContent>
        <Box sx={{ p: 2 }}>
          {loading ? (
            <Typography>Loading Other Documents...</Typography>
          ) : (
            <>
              {!employeeViewOnly && (
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
                      {!employeeViewOnly && (
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
        {!employeeViewOnly && (
          <AddDocumentModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddDocument}
            loading={addLoading}
          />
        )}
        {/* Delete Confirmation Modal */}
        {!employeeViewOnly && (
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
        {!employeeViewOnly && (
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
