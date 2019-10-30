import React from 'react';
import styled from '@emotion/styled';
import camelize from 'camelize';

import Search from 'app/catalog/components/Search';
import Track from 'app/catalog/components/Track';

class TrackList extends React.Component {
  state = {
    tracks: [],
  };

  async componentDidMount() {
    const resp = await fetch('/api/catalog/query');
    const tracks = camelize(await resp.json());
    this.setState({ tracks });
  }

  render() {
    return (
      <Container>
        {this.state.tracks.map(t => (
          <Track {...t} key={t.id} />
        ))}
      </Container>
    );
  }
}

const Container = styled('div')`
  max-width: 900px;
  margin: 0 auto;
`;

const Catalog = _ => (
  <React.Fragment>
    <Header>
      <Search />
    </Header>

    <TrackList />
  </React.Fragment>
);

const Header = styled('div')`
  max-width: 900px;
  margin: 30px auto 0;
`;

export default Catalog;
