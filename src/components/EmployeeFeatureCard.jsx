import React from "react";
import { Card, CardContent } from "@mui/material";

const EmployeeFeatureCard = ({ feature, canEdit, milestone, setMilestones, ...rest }) => (
  <Card
    sx={{
      mb: 3,
      borderRadius: 3,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      border: "1px solid",
      borderColor: "divider",
      overflow: "hidden",
      "&:hover": {
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        transform: "translateY(-1px)",
        transition: "all 0.3s ease",
      },
    }}
  >
    <CardContent>
      {/* everything actually */}
    </CardContent>
  </Card>
);

export default EmployeeFeatureCard;
