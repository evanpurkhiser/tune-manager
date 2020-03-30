import React from "react";
import styled from "@emotion/styled";
import camelize from "camelize";

import Search from "app/catalog/components/Search";
import TrackItem from "app/catalog/components/Track";
import { Track } from "app/importer/types";

type State = {
  tracks: Track[];
};

class TrackList extends React.Component<{}, State> {
  state: State = {
    tracks: []
  };

  async componentDidMount() {
    const resp = await fetch("/api/catalog/query");
    const tracks = camelize(await resp.json());
    this.setState({ tracks });
  }

  render() {
    return (
      <Container>
        {this.state.tracks.map(t => (
          <TrackItem {...t} key={t.id} />
        ))}
      </Container>
    );
  }
}

const Container = styled("div")`
  max-width: 900px;
  margin: 0 auto;
`;

const Catalog = _ => (
  <React.Fragment>
    <Header>
      <Title>
        Tune Manager <small>v0.1</small>
      </Title>

      <Search />
    </Header>

    <TrackList />
  </React.Fragment>
);

const Header = styled("header")`
  max-width: 1000px;
  margin: 2rem auto 0;
`;

const Title = styled("h1")`
  display: grid;
  grid-template-columns: max-content max-content;
  align-items: baseline;
  grid-gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  margin: 2rem 0;
  color: #000;

  small {
    color: #868c96;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
`;

export default Catalog;
