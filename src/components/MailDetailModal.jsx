import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Paper, Chip, Grid } from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";

const MailDetailModal = ({ open, onClose, selectedMail }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
    <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <MailIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>Mail Details</Typography>
      </Box>
    </DialogTitle>
    <DialogContent sx={{ p: 0 }}>
      {selectedMail && (
        <Box>
          {/* Subject and Message */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: "text.primary", borderLeft: 3, borderColor: "primary.main", pl: 2 }}>
              {selectedMail.subject}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "grey.50", borderRadius: 1.5 }}>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "text.primary" }}>
                {selectedMail.message}
              </Typography>
            </Paper>
          </Box>
          {/* Mail Info */}
          <Box sx={{ px: 3, pt: 2.5, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider" }}>
            <Grid container spacing={2.5}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Request Type</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={selectedMail.requestType} size="small" color="primary" variant="outlined" sx={{ pointerEvents: "none" }} />
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Priority</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={selectedMail.priority} size="small" sx={{ pointerEvents: "none" }} color={selectedMail.priority === "High" ? "error" : selectedMail.priority === "Medium" ? "warning" : "default"} />
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Department</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {selectedMail.selectedDepartment ? (
                    <Chip label={selectedMail.selectedDepartment} size="small" color="secondary" variant="outlined" sx={{ pointerEvents: "none" }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.9rem" }}>Not specified</Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Sent To</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                  {[...(selectedMail.recipients ? new Set(selectedMail.recipients.map((recipient) => recipient.position)) : [])].join(", ")}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Date</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                  {new Date(selectedMail.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedMail.createdAt).toLocaleTimeString()}
                </Typography>
              </Grid>
              {selectedMail.ccRecipients && selectedMail.ccRecipients.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>CC Recipients</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                    {[...new Set(selectedMail.ccRecipients.map((cc) => cc.position))].join(", ")}
                  </Typography>
                </Grid>
              )}
              {/* Leave Application Details */}
              {selectedMail.requestType === "Leave Application" && selectedMail.leaveDetails && (
                <>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Leave Type</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={selectedMail.leaveDetails.leaveType} size="small" color="info" sx={{ pointerEvents: "none" }} />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>From Date</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                      {new Date(selectedMail.leaveDetails.fromDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({selectedMail.leaveDetails.fromSession} session)
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>To Date</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                      {new Date(selectedMail.leaveDetails.toDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({selectedMail.leaveDetails.toSession} session)
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Approval Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={selectedMail.approvalStatus || "Pending"} size="small" color={selectedMail.approvalStatus === "Approved" ? "success" : selectedMail.approvalStatus === "Rejected" ? "error" : "warning"} sx={{ pointerEvents: "none" }} />
                    </Box>
                  </Grid>
                  {selectedMail.approvalComments && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Approval Comments</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                        {selectedMail.approvalComments}
                      </Typography>
                    </Grid>
                  )}
                </>
              )}
              {/* Work from Home Details */}
              {selectedMail.requestType === "Work from Home" && selectedMail.wfhDetails && (
                <>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>From Date</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                      {new Date(selectedMail.wfhDetails.fromDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>To Date</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                      {new Date(selectedMail.wfhDetails.toDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Approval Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={selectedMail.approvalStatus || "Pending"} size="small" color={selectedMail.approvalStatus === "Approved" ? "success" : selectedMail.approvalStatus === "Rejected" ? "error" : "warning"} sx={{ pointerEvents: "none" }} />
                    </Box>
                  </Grid>
                  {selectedMail.approvalComments && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Approval Comments</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.9rem" }}>
                        {selectedMail.approvalComments}
                      </Typography>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Box>
        </Box>
      )}
    </DialogContent>
    <DialogActions sx={{ p: 3 }}>
      <Button onClick={onClose} variant="contained" sx={{ minWidth: 100 }}>
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

export default MailDetailModal;
