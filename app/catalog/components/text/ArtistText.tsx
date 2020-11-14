import React from 'react';
import styled from '@emotion/styled';

import {strictSplitOn} from 'app/importer/util/artistMatch';
import {tagHover} from './tagStyles';

type Props = {
  artist: string;
};

const ArtistText = ({artist}: Props) => {
  const separators = [...artist.matchAll(strictSplitOn)].map((s, i) => (
    <Separator key={i}>{s.toString().replaceAll(' ', '\u00A0')}</Separator>
  ));

  const artists = artist
    .split(strictSplitOn)
    .map((artist, i) => <Artist key={i}>{artist}</Artist>);

  const el = artists
    .map((el, i) => [el, separators[i]])
    .flat()
    .filter(v => v !== undefined);

  return <React.Fragment>{el}</React.Fragment>;
};

const Artist = styled('span')`
  ${tagHover('#EA5959')};
`;

const Separator = styled('span')`
  color: #888;
`;

export default ArtistText;
