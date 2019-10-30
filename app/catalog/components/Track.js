import React from 'react';
import styled from '@emotion/styled';

import Artwork from 'app/catalog/components/Artwork';

const Track = ({
  artist,
  title,
  album,
  remixer,
  release,
  publisher,
  disc,
  track,
  genre,
  key,
  bpm,
  year,
  artworkHash,
  className,
}) => (
  <div className={className}>
    <StyledArtwork artworkHash={artworkHash} size={38} />
    {artist} - {title}
  </div>
);

const StyledArtwork = styled(Artwork)`
  border-radius: 2px;
`;

export default styled(Track)`
  display: grid;
  font-size: 14px;
  margin-top: 20px;
`;
