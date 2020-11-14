import React from 'react';
import styled from '@emotion/styled';
import {css} from '@emotion/core';

import Artwork from 'app/catalog/components/Artwork';
import {Track} from 'app/catalog/types';
import {KEY_COLORS} from './Key';
import ArtistText from './text/ArtistText';
import GenreText from './text/GenreText';
import PublisherText from './text/PublisherText';
import AlbumText from './text/AlbumText';
import ReleaseText from './text/ReleaseText';
import Placeholder from './text/Placeholder';
import BpmText from './text/BpmText';

type Props = {
  track: Track;
  className?: string;
};

const TrackItem = ({
  className,
  track: {
    artist,
    title,
    album,
    genre,
    release,
    publisher,
    year,
    key,
    bpm,
    track,
    disc,
    artworkHash,
  },
}: Props) => (
  <Container className={className}>
    <ArtworkContainer item="artworkHash">
      <Artwork artworkHash={artworkHash} size={57} />
    </ArtworkContainer>
    <Item size="15px" item="title">
      {title}
    </Item>
    <Item size="13px" item="artist">
      <ArtistText artist={artist} />
    </Item>
    <Item item="album">
      {album ? <AlbumText>{album}</AlbumText> : <Placeholder text="No Album" />}
    </Item>
    <Item item="genre">
      {genre ? <GenreText>{genre}</GenreText> : <Placeholder text="Genre Missing" />}
    </Item>
    <Item item="publisher" radius="bottom-right">
      {publisher ? (
        <PublisherText>{publisher}</PublisherText>
      ) : (
        <Placeholder text="No Publisher" />
      )}
    </Item>
    <Item center item="year">
      {year}
    </Item>
    <Item center item="bpm">
      {bpm ? <BpmText bpm={bpm} /> : <Placeholder text="BPM Empty" />}
    </Item>
    <Item item="release">
      {release ? (
        <ReleaseText>{release}</ReleaseText>
      ) : (
        <Placeholder text="Blank Release" />
      )}
    </Item>
    <Item center item="track">
      {track ?? <Placeholder text="No Tracks" />}
    </Item>
    <Item center item="disc" radius="top-right">
      {disc ?? <Placeholder text="No Discs" />}
    </Item>
    <Key item="key">{key}</Key>
  </Container>
);

export default TrackItem;

const Container = styled('div')`
  background: #eef2f5;
  font-size: 0.75rem;
  border-radius: 4px;
  display: grid;
  grid-template-columns: 57px 3fr minmax(128px, 1fr) 76px 48px 64px minmax(90px, 1fr) 64px 64px;
  grid-template-rows: 30px 26px;
  gap: 1px;
  grid-template-areas:
    'artworkHash title genre bpm key year release track disc'
    'artworkHash artist album album album album publisher publisher publisher';

  margin: -2px;
  border: 2px solid transparent;
  transition: border-color 100ms ease-in-out;

  &:hover {
    border-color: #e5e5e3;
  }

  > * {
    background: #fff;
  }
`;

type ItemProps = {
  item: keyof Track;
  center?: boolean;
  size?: string;
  radius?: string;
  children: React.ReactNode;
};

type MixinOptions = {
  padding?: boolean;
};

const itemMixin = (p: ItemProps, {padding}: MixinOptions = {}) => css`
  grid-area: ${p.item};
  display: flex;
  align-items: center;
  ${p.radius && `border-${p.radius}-radius: 4px`};
  ${p.center && 'justify-content: center'};
  ${padding && 'padding: 0 0.5rem'};
  ${p.size && `font-size: ${p.size}`};
`;

const Item = styled('div')<ItemProps>`
  ${p => itemMixin(p, {padding: true})}
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

const Key = styled('div')<ItemProps>`
  ${p => itemMixin({...p, center: true})}

  display: grid;
  gap: 0.5rem;
  grid-template-columns: max-content 1fr;
  padding-right: 0.5rem;
  text-align: center;

  &:before {
    content: '';
    display: block;
    height: 100%;
    width: 4px;
    background-color: ${p => typeof p.children === 'string' && KEY_COLORS[p.children]};
  }
`;

const ArtworkContainer = styled('div')<ItemProps>`
  ${p => itemMixin({...p, center: true})}
  border-radius: 4px 0 0 4px;

  > * {
    border-radius: 3px 0 0 3px;
  }
`;
