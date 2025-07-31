import React from "react";
import EmployeeFeatureCard from "./EmployeeFeatureCard";

const EmployeeFeatureList = ({ features, canEdit, milestone, setMilestones, ...rest }) => (
  <>
    {features.map((feature) => (
      <EmployeeFeatureCard
        key={feature.id}
        feature={feature}
        canEdit={canEdit}
        milestone={milestone}
        setMilestones={setMilestones}
        {...rest}
      />
    ))}
  </>
);

export default EmployeeFeatureList;
