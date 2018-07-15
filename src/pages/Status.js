import * as React from 'react';
import { Grid, ListView, ListViewItem, ListViewIcon, ListViewInfoItem, Row, Col } from 'patternfly-react';

import { ZuulApiRoot } from './constants';

class QueueStatus extends React.Component {
   render() {
       return (<Row><Col sm={11}>{this.props.queue.name}</Col></Row>);
  }
}

class PipelineStatus extends React.Component {
  render() {
      return (<ListViewItem
                leftContent={<ListViewIcon />}
                additionalInfo={[
                        <ListViewInfoItem />,
                        <ListViewInfoItem />,
                        <ListViewInfoItem />,
                ]}
              heading={this.props.pipeline.name}
              description={this.props.pipeline.description}
              >{this.props.pipeline.change_queues.map(item => (
                      <QueueStatus queue={item} />
              ))}</ListViewItem>);
  }
}

class Status extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: []
    };
  }

  componentDidMount() {
      fetch(ZuulApiRoot + "/status")
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            items: result.pipelines
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
            <PipelineStatus pipeline={item} />
          ))}
        </ListView>
      );
    }
  }
}


const StatusPage = () => (
  <Grid fluid className="container-pf-nav-pf-vertical">
    <Grid.Row>
      <Grid.Col xs={12}>
        <div className="page-header">
          <h1>Status Page</h1>
        </div>
      </Grid.Col>
    </Grid.Row>
    <Status />
  </Grid>
);

export default StatusPage;
