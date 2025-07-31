import React from "react";
import { Card, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";

const EmployeeNoteCard = ({ note, canEdit, ...rest }) => (
  <Card
    sx={{
      borderRadius: 3,
      boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
      borderColor: "warning.200",
      overflow: "hidden",
      mb: 1,
      bgcolor: "linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)",
      "&:hover": {
        boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
        transform: "translateY(-1px)",
        transition: "all 0.3s ease",
      },
    }}
  >
    <Accordion>
      <AccordionSummary>
        {/* ...Notes summary UI... */}
      </AccordionSummary>
      <AccordionDetails>
        {/* ...Notes details UI... */}
      </AccordionDetails>
    </Accordion>
  </Card>
);

export default EmployeeNoteCard;
