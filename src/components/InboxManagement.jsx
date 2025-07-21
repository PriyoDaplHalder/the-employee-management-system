"use client";

import { useState, useEffect } from "react";
import { getToken } from "../utils/storage";
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Grid,
  TextField,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Mail as MailIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";

const InboxManagement = ({ user, onBack }) => {
  const [mounted, setMounted] = useState(false);
  const [receivedMails, setReceivedMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMail, setSelectedMail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Approval states
  const [processingApproval, setProcessingApproval] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");

  // Pagination states
  const [page, setPage] = useState(0); // Current page
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setMounted(true);
    fetchReceivedMails();
  }, []);

  const fetchReceivedMails = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch("/api/mail/inbox", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inbox mails");
      }

      const data = await response.json();
      setReceivedMails(data.mails || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchReceivedMails();
  };

  const openMailDetail = (mail) => {
    setSelectedMail(mail);
    setShowDetailModal(true);
  };

  const closeMailDetail = () => {
    setSelectedMail(null);
    setShowDetailModal(false);
    setApprovalComments(""); // Reset comments when closing
  };

  const handleApproval = async (action) => {
    if (!selectedMail) return;

    setProcessingApproval(true);
    try {
      const token = getToken();
      const response = await fetch("/api/mail/approval", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mailId: selectedMail._id,
          action: action, // 'approve' or 'reject'
          comments: approvalComments.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        alert(`Leave application ${action}d successfully!`);

        // Refresh mail list
        fetchReceivedMails();

        // Close modal
        closeMailDetail();
      } else {
        alert(`Failed to ${action} leave application: ${data.error}`);
      }
    } catch (err) {
      alert(`Error processing ${action}: ${err.message}`);
    } finally {
      setProcessingApproval(false);
    }
  };

  const clearError = () => setError("");

  // Handle change of page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle change of rows per page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Slice the receivedMails array based on pagination
  const paginatedMails = receivedMails.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!mounted) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "transparent",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="primary"
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "text.primary" }}
          >
            Inbox - Received Mails
          </Typography>
          <IconButton
            color="primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Inbox Content */}
        <Paper elevation={2} sx={{ borderRadius: 3 }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <MailIcon color="primary" />
              <Typography variant="h6" color="primary.main">
                Your Inbox
              </Typography>
            </Box>

            {/* User Position Info */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Position-Based Inbox:</strong> You receive mails sent to
                your current position. To know your current position, please
                check your profile.
                {user?.role === "management" &&
                  " As management, you can view all emails with complete recipient details including TO and CC recipients."}
              </Typography>
            </Alert>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : receivedMails.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <MailIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Mails Received Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mails sent to your position will appear here.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ bgcolor: "primary.main" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: "white" }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "white" }}>
                        From
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "white" }}>
                        Request Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "white" }}>
                        Subject
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "white" }}>
                        Priority
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "white" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedMails.map((mail) => (
                      <TableRow key={mail._id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(mail.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(mail.createdAt).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {mail.senderName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {mail.senderEmail}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={mail.requestType}
                            color="primary"
                            variant="outlined"
                            size="small"
                            sx={{ pointerEvents: "none" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mail.subject}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={mail.priority}
                            color={
                              mail.priority === "High"
                                ? "error"
                                : mail.priority === "Medium"
                                ? "warning"
                                : "default"
                            }
                            sx={{ pointerEvents: "none" }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openMailDetail(mail)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={receivedMails.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Mails per page"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} of ${
                      count !== -1 ? count : `more than ${to}`
                    }`
                  }
                  sx={{ mt: 2 }}
                />
              </TableContainer>
            )}

            {/* Pagination Controls */}
          </Box>
        </Paper>
      </Container>

      {/* Mail Detail Modal */}
      <Dialog
        open={showDetailModal}
        onClose={closeMailDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MailIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Mail Details
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedMail && (
            <Box>
              {/* Subject and Message */}
              <Box sx={{ p: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: "text.primary",
                    borderLeft: 3,
                    borderColor: "primary.main",
                    pl: 2,
                  }}
                >
                  {selectedMail.subject}
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    bgcolor: "grey.50",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      color: "text.primary",
                    }}
                  >
                    {selectedMail.message}
                  </Typography>
                </Paper>
              </Box>

              {/* Mail Info */}
              <Box
                sx={{
                  px: 3,
                  pt: 2.5,
                  bgcolor: "grey.50",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Grid container spacing={2.5}>
                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Request Type
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedMail.requestType}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ pointerEvents: "none" }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Priority
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedMail.priority}
                        size="small"
                        sx={{ pointerEvents: "none" }}
                        color={
                          selectedMail.priority === "High"
                            ? "error"
                            : selectedMail.priority === "Medium"
                            ? "warning"
                            : "default"
                        }
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Sent From
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, fontSize: "0.9rem" }}
                    >
                      {selectedMail.senderName}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Sent To
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, fontSize: "0.9rem" }}
                    >
                      {[
                        ...new Set(
                          selectedMail.recipients?.map(
                            (recipient) => recipient.position
                          ) || []
                        ),
                      ].join(", ")}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Date
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, fontSize: "0.9rem" }}
                    >
                      {new Date(selectedMail.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(selectedMail.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Grid>

                  {selectedMail.ccRecipients &&
                    selectedMail.ccRecipients.length > 0 && (
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          CC Recipients
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, fontSize: "0.9rem" }}
                        >
                          {[
                            ...new Set(
                              selectedMail.ccRecipients.map((cc) => cc.position)
                            ),
                          ].join(", ")}
                        </Typography>
                      </Grid>
                    )}

                  {/* Leave Application Details */}
                  {selectedMail.requestType === "Leave Application" &&
                    selectedMail.leaveDetails && (
                      <>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography
                            variant="h6"
                            color="primary"
                            fontWeight={600}
                            sx={{ mb: 2 }}
                          >
                            Leave Details
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            Leave Type
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={selectedMail.leaveDetails.leaveType}
                              size="small"
                              color="info"
                              sx={{ pointerEvents: "none" }}
                            />
                          </Box>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            From Date
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ mt: 0.5, fontSize: "0.9rem" }}
                          >
                            {new Date(
                              selectedMail.leaveDetails.fromDate
                            ).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({selectedMail.leaveDetails.fromSession} session)
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            To Date
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ mt: 0.5, fontSize: "0.9rem" }}
                          >
                            {new Date(
                              selectedMail.leaveDetails.toDate
                            ).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({selectedMail.leaveDetails.toSession} session)
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            Approval Status
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={selectedMail.approvalStatus || "Pending"}
                              size="small"
                              color={
                                selectedMail.approvalStatus === "Approved"
                                  ? "success"
                                  : selectedMail.approvalStatus === "Rejected"
                                  ? "error"
                                  : "warning"
                              }
                              sx={{ pointerEvents: "none" }}
                            />
                          </Box>
                        </Grid>
                      </>
                    )}
                </Grid>

                {/* Approval Actions for Leave Applications */}
                {selectedMail.requestType === "Leave Application" &&
                  selectedMail.requiresApproval &&
                  selectedMail.approvalStatus === "Pending" && (
                    <Box
                      sx={{
                        mt: 3,
                        pt: 3,
                        borderTop: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="primary"
                        fontWeight={600}
                        sx={{ mb: 2 }}
                      >
                        Approval Actions
                      </Typography>

                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Comments (Optional)"
                        value={approvalComments}
                        onChange={(e) => setApprovalComments(e.target.value)}
                        placeholder="Add comments for the applicant..."
                        sx={{ mb: 2 }}
                      />

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApproval("approve")}
                          disabled={processingApproval}
                          sx={{ minWidth: 120 }}
                        >
                          {processingApproval ? (
                            <CircularProgress size={20} />
                          ) : (
                            "Approve"
                          )}
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => handleApproval("reject")}
                          disabled={processingApproval}
                          sx={{ minWidth: 120 }}
                        >
                          {processingApproval ? (
                            <CircularProgress size={20} />
                          ) : (
                            "Reject"
                          )}
                        </Button>
                      </Box>
                    </Box>
                  )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMailDetail}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InboxManagement;
