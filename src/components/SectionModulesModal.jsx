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
  ViewModule as ModuleIcon,
} from "@mui/icons-material";
import { getToken } from "../utils/storage";
import CustomSnackbar from "./CustomSnackbar";
import AddModuleModal from "./AddModuleModal";
import ModuleFunctionsModal from "./ModuleFunctionsModal";

const SectionModulesModal = ({ open, onClose, project, section, onSave }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showModuleFunctionsModal, setShowModuleFunctionsModal] =
    useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (open && section) {
      fetchModules();
    }
  }, [open, section]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/projects/${project._id}/sections/${section._id}/modules`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
      setSnackbar({
        open: true,
        message: "Error fetching modules",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModuleClick = (module) => {
    setSelectedModule(module);
    setShowModuleFunctionsModal(true);
  };

  const handleModuleSave = (newModules) => {
    setModules(newModules);
    setShowAddModuleModal(false);
  };

  const handleFunctionsSave = () => {
    setShowModuleFunctionsModal(false);
    fetchModules(); // Refresh modules to get updated function counts
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
              {section?.title} - Modules
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project?.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
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
              Modules ({modules.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddModuleModal(true)}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Add Module
            </Button>
          </Box>

          {modules.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <ModuleIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No modules added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add modules to organize functions within this section.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {modules.map((module, index) => (
                <Grid item xs={12} sm={6} md={4} key={module._id || index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 4,
                      },
                      bgcolor: "primary.50",
                      border: "1px solid",
                      borderColor: "primary.200",
                    }}
                    onClick={() => handleModuleClick(module)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <ModuleIcon color="primary" fontSize="small" />
                        <Typography
                          variant="subtitle1"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        >
                          {module.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {module.functions?.length || 0} function(s)
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

      <AddModuleModal
        open={showAddModuleModal}
        onClose={() => setShowAddModuleModal(false)}
        project={project}
        section={section}
        initialModules={modules}
        onSave={handleModuleSave}
      />

      <ModuleFunctionsModal
        open={showModuleFunctionsModal}
        onClose={() => setShowModuleFunctionsModal(false)}
        project={project}
        section={section}
        module={selectedModule}
        onSave={handleFunctionsSave}
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

export default SectionModulesModal;
