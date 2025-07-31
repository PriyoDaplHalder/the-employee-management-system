import React from "react";
import { Card, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import EmployeeFeatureList from "./EmployeeFeatureList";

const EmployeeMilestoneCard = ({
  milestone,
  canEdit,
  expandedMilestone,
  setExpandedMilestone,
  editingMilestone,
  setEditingMilestone,
  setMilestones,
  setMilestoneToDelete,
  ...rest
}) => (
  <Card
    sx={{
      borderRadius: 3,
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      transition: "all 0.3s ease",
      mb: 2,
    }}
  >
    <Accordion
      expanded={expandedMilestone === milestone.id}
      onChange={() =>
        setExpandedMilestone(
          expandedMilestone === milestone.id ? null : milestone.id
        )
      }
    >
      <AccordionSummary>
        {/* ...milestone summary UI... */}
      </AccordionSummary>
      <AccordionDetails>
        {/* ...milestone details UI... */}
        <EmployeeFeatureList
          features={milestone.features}
          canEdit={canEdit}
          milestone={milestone}
          setMilestones={setMilestones}
          {...rest}
        />
      </AccordionDetails>
    </Accordion>
  </Card>
);

export default EmployeeMilestoneCard;
