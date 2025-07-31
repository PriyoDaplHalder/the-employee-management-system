import { Grid, Card, CardContent, Typography } from "@mui/material";

const EmployeeStatsCards = ({ stats }) => (
  <Grid container spacing={3} sx={{ mb: 1, textAlign: "center" }}>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>
            Total Employees
          </Typography>
          <Typography variant="h4">{stats.total}</Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>
            Active
          </Typography>
          <Typography variant="h4" color="success.main">
            {stats.active}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>
            Inactive
          </Typography>
          <Typography variant="h4" color="error.main">
            {stats.inactive}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>
            Departments
          </Typography>
          <Typography variant="h4" color="primary.main">
            {stats.departments}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

export default EmployeeStatsCards;
