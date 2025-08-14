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
  Grid,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Code as FunctionsIcon,
} from "@mui/icons-material";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";
import AddFunctionModal from "./AddFunctionModal";
import FunctionDescriptionsModal from "./FunctionDescriptionsModal";

const ModuleFunctionsModal = ({ open, onClose, project, section, module, onSave }) => {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddFunctionModal, setShowAddFunctionModal] = useState(false);
  const [showFunctionDescriptionsModal, setShowFunctionDescriptionsModal] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (open && module) {
      fetchFunctions();
    }
  }, [open, module]);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/projects/${project._id}/sections/${section._id}/modules/${module._id}/functions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFunctions(data.functions || []);
      }
    } catch (error) {
      console.error("Error fetching functions:", error);
      setSnackbar({
        open: true,
        message: "Error fetching functions",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFunctionClick = (functionItem) => {
    setSelectedFunction(functionItem);
    setShowFunctionDescriptionsModal(true);
  };

  const handleFunctionSave = (newFunctions) => {
    setFunctions(newFunctions);
    setShowAddFunctionModal(false);
  };

  const handleDescriptionsSave = () => {
    setShowFunctionDescriptionsModal(false);
    fetchFunctions(); // Refresh functions to get updated description counts
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
              {module?.title} - Functions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {section?.title} | {project?.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
              Functions ({functions.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddFunctionModal(true)}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Add Function
            </Button>
          </Box>

          {functions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <FunctionsIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No functions added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add functions to organize descriptions within this module.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {functions.map((functionItem, index) => (
                <Grid item xs={12} sm={6} md={4} key={functionItem._id || index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 4,
                      },
                      bgcolor: "secondary.50",
                      border: "1px solid",
                      borderColor: "secondary.200",
                    }}
                    onClick={() => handleFunctionClick(functionItem)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <FunctionsIcon color="secondary" fontSize="small" />
                        <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 600 }}>
                          {functionItem.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {functionItem.descriptions?.length || 0} description(s)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <AddFunctionModal
        open={showAddFunctionModal}
        onClose={() => setShowAddFunctionModal(false)}
        project={project}
        section={section}
        module={module}
        onSave={handleFunctionSave}
      />

      <FunctionDescriptionsModal
        open={showFunctionDescriptionsModal}
        onClose={() => setShowFunctionDescriptionsModal(false)}
        project={project}
        section={section}
        module={module}
        functionItem={selectedFunction}
        onSave={handleDescriptionsSave}
      />

      <CustomSnackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </>
  );
};

export default ModuleFunctionsModal;
