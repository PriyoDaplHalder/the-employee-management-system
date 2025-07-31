import React from "react";
import EmployeeMilestoneCard from "./EmployeeMilestoneCard";

const EmployeeMilestoneList = ({
  milestones,
  canEdit,
  expandedMilestone,
  setExpandedMilestone,
  editingMilestone,
  setEditingMilestone,
  setMilestones,
  milestoneToDelete,
  setMilestoneToDelete,
  ...rest
}) => (
  <>
    {milestones.map((milestone) => (
      <EmployeeMilestoneCard
        key={milestone.id}
        milestone={milestone}
        canEdit={canEdit}
        expandedMilestone={expandedMilestone}
        setExpandedMilestone={setExpandedMilestone}
        editingMilestone={editingMilestone}
        setEditingMilestone={setEditingMilestone}
        setMilestones={setMilestones}
        setMilestoneToDelete={setMilestoneToDelete}
        {...rest}
      />
    ))}
  </>
);

export default EmployeeMilestoneList;
