import React from 'react';

import styled from '@emotion/styled';

import {strictSplitOn} from 'app/importer/util/artistMatch';

import {tagHover} from './tagStyles';

type Props = {
  artist: string;
};

const ArtistText = ({artist}: Props) => {
  const separators = [...artist.matchAll(strictSplitOn)].map((s, i) => (
    // oxlint-disable-next-line react/no-array-index-key -- transient render of split parts
    <Separator key={i}>{s.toString().replaceAll(' ', '\u00A0')}</Separator>
  ));

  const artists = artist.split(strictSplitOn).map((artist, i) => (
    // oxlint-disable-next-line react/no-array-index-key -- transient render of split parts
    <Artist key={i}>{artist}</Artist>
  ));

  const el = artists.flatMap((el, i) => [el, separators[i]]).filter(v => v !== undefined);

  // oxlint-disable-next-line react/jsx-no-useless-fragment -- needed for React 17 JSX return type
  return <>{el}</>;
};

const Artist = styled('span')`
  ${tagHover('#EA5959')};
`;

const Separator = styled('span')`
  color: #888;
`;

export default ArtistText;
