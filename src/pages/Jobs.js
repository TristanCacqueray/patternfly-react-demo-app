import * as React from 'react';
import { ListView, Grid } from 'patternfly-react';

import { ZuulApiRoot } from './constants';

class Jobs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: []
    };
  }

  componentDidMount() {
      fetch(ZuulApiRoot + "/jobs")
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            items: result
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  render() {
    const { error, isLoaded, items } = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
        <ListView>
          {items.map(item => (
                  <ListView.Item
                     heading={item.name}
                     description={item.description} />
          ))}
        </ListView>
      );
    }
  }
}


const JobsPage = () => (
  <Grid fluid className="container-pf-nav-pf-vertical">
    <Grid.Row>
      <Grid.Col xs={12}>
        <div className="page-header">
          <h1>Jobs Page</h1>
        </div>
      </Grid.Col>
    </Grid.Row>
    <Jobs />
  </Grid>
);

export default JobsPage;
