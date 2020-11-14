import React from 'react';
import styled from '@emotion/styled';
import camelize from 'camelize';

import Search from 'app/catalog/components/Search';
import TrackItem from 'app/catalog/components/Track';
import {Track} from 'app/importer/types';

const TrackList = () => {
  const [tracks, setTracks] = React.useState<Track[]>([]);

  const loadTracks = async () => {
    const resp = await fetch('/api/catalog/query');
    const tracks = camelize(await resp.json());
    setTracks(tracks);
  };

  React.useEffect(() => {
    loadTracks();
  }, []);

  return (
    <Container>
      {tracks.map(t => (
        <TrackItem track={t} key={t.id} />
      ))}
    </Container>
  );
};

const Container = styled('div')`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Catalog = _ => (
  <React.Fragment>
    <Header>
      <Title>
        Tune Manager <small>v0.1</small>
      </Title>

      <Search />
    </Header>

    <Content>
      <TrackList />
    </Content>
  </React.Fragment>
);

const Content = styled('div')`
  background: #f5f5f5;
`;

const Header = styled('header')`
  max-width: 1000px;
  margin: 2rem auto 2rem;
`;

const Title = styled('h1')`
  display: grid;
  grid-template-columns: max-content max-content;
  align-items: baseline;
  grid-gap: 0.5rem;
  font-size: 1rem;
  font-weight: 400;
  margin: 2rem 0;
  color: #000;

  small {
    color: #868c96;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
`;

export default Catalog;
