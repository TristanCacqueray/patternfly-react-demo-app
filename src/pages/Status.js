import * as React from 'react';
import { Grid } from 'patternfly-react';
import { EmptyStateComponent } from '../components/EmptyStateComponent';

const StatusPage = () => (
  <Grid fluid className="container-pf-nav-pf-vertical">
    <EmptyStateComponent title="Status" />
  </Grid>
);

export default StatusPage;
