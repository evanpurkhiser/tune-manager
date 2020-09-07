import React from 'react';
import styled from '@emotion/styled';

const Artwork = styled(({artworkHash, className}) => (
  <img src={`/api/catalog/artwork/${artworkHash}`} className={className} />
))`
  height: ${p => p.size}px;
  width: ${p => p.size}px;
`;

export default Artwork;
