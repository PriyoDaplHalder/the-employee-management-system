import React from "react";
import { Paper, Box, Typography, Alert, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button } from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";

const MailHistoryTable = ({ mailHistory, loading, openMailDetail }) => (
  <Paper elevation={2} sx={{ borderRadius: 3 }}>
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Your Mail History
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>About Cross-Department Mailing:</strong> The main recipient ("Send To Position") is always from the selected department, while CC recipients can be from multiple departments. When you send a mail to "HR Manager" in the "Development" department with CC to positions from "Marketing" and "Finance", it ensures precise targeting while allowing cross-departmental communication.
        </Typography>
      </Alert>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : mailHistory.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <MailIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Mails Sent Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your sent mail history will appear here.
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ bgcolor: "primary.main" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "white" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "white" }}>Request Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "white" }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "white" }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "white" }}>Sent To Positions</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "white" }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "white" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "white" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mailHistory.map((mail) => (
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
                    <Chip label={mail.requestType} color="primary" variant="outlined" size="small" sx={{ pointerEvents: "none" }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{mail.subject}</Typography>
                  </TableCell>
                  <TableCell>
                    {mail.selectedDepartment ? (
                      <Chip label={mail.selectedDepartment} size="small" color="primary" variant="outlined" sx={{ pointerEvents: "none" }} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not specified</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {[...new Set(mail.recipients.map((recipient) => recipient.position))].map((position, index) => (
                        <Chip key={index} sx={{ pointerEvents: "none", alignSelf: "flex-start" }} label={position} size="small" variant="outlined" color="primary" />
                      ))}
                      {mail.ccRecipients && mail.ccRecipients.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          CC: {[...new Set(mail.ccRecipients.map((cc) => cc.position))].join(", ")}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={mail.priority} color={mail.priority === "High" ? "error" : mail.priority === "Medium" ? "warning" : "default"} sx={{ pointerEvents: "none" }} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Chip label={mail.status} color={mail.status === "Sent" ? "success" : "default"} size="small" sx={{ pointerEvents: "none" }} />
                      {mail.emailStatus && (
                        <Chip label={`Email: ${mail.emailStatus}`} color={mail.emailStatus === "Sent" ? "success" : mail.emailStatus === "Partially Sent" ? "warning" : mail.emailStatus === "Failed" ? "error" : "default"} size="small" variant="outlined" sx={{ pointerEvents: "none" }} />
                      )}
                      {(mail.requestType === "Leave Application" || mail.requestType === "Work from Home") && mail.approvalStatus && (
                        <Chip label={`Approval: ${mail.approvalStatus}`} color={mail.approvalStatus === "Approved" ? "success" : mail.approvalStatus === "Rejected" ? "error" : "warning"} size="small" variant="outlined" sx={{ pointerEvents: "none" }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" sx={{ fontSize: "0.70rem" }} onClick={() => openMailDetail(mail)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  </Paper>
);

export default MailHistoryTable;
