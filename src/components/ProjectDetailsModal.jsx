"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import {
  Timeline as TimelineIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import EmployeeMilestoneModal from "./EmployeeMilestoneModal";
import ProjectSRSDocumentModal from "./ProjectSRSDocumentModal";
import ProjectOtherDocumentModal from "./ProjectOtherDocumentModal";

const ProjectDetailsModal = ({ assignment, open, onClose, user }) => {
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showSRSModal, setShowSRSModal] = useState(false);
  const [showOtherDocsModal, setShowOtherDocsModal] = useState(false);

  if (!assignment) return null;

  const { projectId: project, assignedBy, assignedDate, notes } = assignment;

  const handleViewMilestones = () => {
    setShowMilestoneModal(true);
  };

  const handleCloseMilestoneModal = () => {
    setShowMilestoneModal(false);
  };

  const handleViewSRSDocument = () => {
    setShowSRSModal(true);
  };

  const handleCloseSRSModal = () => {
    setShowSRSModal(false);
  };

  const handleViewOtherDocuments = () => {
    setShowOtherDocsModal(true);
  };

  const handleCloseOtherDocsModal = () => {
    setShowOtherDocsModal(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              fontSize: "1.25rem",
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {project?.name || "Project Details"}
          </Typography>
          <Chip
            label={project?.isActive === false ? "Inactive" : "Active"}
            variant="outlined"
            color={project?.isActive === false ? "default" : "success"}
            size="small"
            sx={{ fontWeight: 500, pointerEvents: "none" }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Project Description */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: "text.primary",
              fontWeight: 600,
              mb: 1.5,
              fontSize: "1rem",
            }}
          >
            Description
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.5 }}
            >
              {project?.details || "No description available"}
            </Typography>
          </Box>
        </Box>

        {/* Assignment Details */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: "text.primary",
              fontWeight: 600,
              mb: 1.5,
              fontSize: "1rem",
            }}
          >
            Assignment Details
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Assigned Date
              </Typography>
              <Typography
                variant="body2"
                color="text.primary"
                sx={{ fontWeight: 500 }}
              >
                {new Date(assignedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Project Created
              </Typography>
              <Typography
                variant="body2"
                color="text.primary"
                sx={{ fontWeight: 500 }}
              >
                {new Date(project?.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Typography>
            </Box>

            {project?.updatedAt && project.updatedAt !== project.createdAt && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Last Updated
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ fontWeight: 500 }}
                >
                  {new Date(project.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Typography>
              </Box>
            )}

            {assignedBy && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Assigned By
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{
                    fontWeight: 500,
                    textAlign: "right",
                    wordBreak: "break-word",
                    maxWidth: "60%",
                  }}
                >
                  {assignedBy.email}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Assignment Notes */}
        {notes && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: "text.primary",
                fontWeight: 600,
                mb: 1.5,
                fontSize: "1rem",
              }}
            >
              Assignment Notes
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: "primary.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "grey.300",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.5,
                  color: "text.primary",
                }}
              >
                {notes}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Button
            onClick={handleViewMilestones}
            variant="outlined"
            startIcon={<TimelineIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 1.5,
              py: 1.2,
              flex: 1,
            }}
          >
            View Milestones
          </Button>
          <Button
            onClick={handleViewSRSDocument}
            variant="outlined"
            startIcon={<DescriptionIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 1.5,
              py: 1.2,
              flex: 1,
            }}
          >
            SRS Document
          </Button>
          <Button
            onClick={handleViewOtherDocuments}
            variant="outlined"
            startIcon={<FileCopyIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 1.5,
              py: 1.2,
              flex: 1,
            }}
          >
            Other Documents
          </Button>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 1.5,
              py: 1.2,
              flex: 1,
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <EmployeeMilestoneModal
          assignment={assignment}
          open={showMilestoneModal}
          onClose={handleCloseMilestoneModal}
          user={user}
        />
      )}

      {/* SRS Document Modal */}
      {showSRSModal && (
        <ProjectSRSDocumentModal
          project={project}
          open={showSRSModal}
          onClose={handleCloseSRSModal}
          user={user || { role: "employee" }}
        />
      )}

      {/* Other Documents Modal */}
      {showOtherDocsModal && (
        <ProjectOtherDocumentModal
          project={project}
          open={showOtherDocsModal}
          onClose={handleCloseOtherDocsModal}
          user={user || { role: "employee" }}
        />
      )}
    </Dialog>
  );
};

export default ProjectDetailsModal;
