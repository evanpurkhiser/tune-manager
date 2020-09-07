import React from 'react';
import styled from '@emotion/styled';
import css from '@emotion/css';
import {Filter} from 'app/catalog/types';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  value?: string;
  type: Filter | 'freeText';
  labelShadow?: string;
  valueShadow?: string;
};

const TagContainer = ({
  label,
  value,
  labelShadow,
  valueShadow,
  type,
  ...props
}: Props) => (
  <div {...props}>
    {label && (
      <Label shadow={labelShadow} tagType={type}>
        {label}
      </Label>
    )}
    {value && <Value shadow={valueShadow}>{value}</Value>}
  </div>
);

const shadowStyle = (text: Props['labelShadow'], color: string) => css`
  display: grid;
  grid-template-columns: max-content;
  grid-template-rows: 0;

  &:before {
    content: '${text}';
    color: ${color};
  }
`;

const typeColor: Record<Props['type'], [string, string]> = {
  freeText: ['#ececec', 'inherit'],
  id: ['#373B3E', '#fff'],
  genre: ['#000000', '#fff'],
  artist: ['#EA5959', '#fff'],
  title: ['#59ADEA', '#fff'],
  album: ['#75DD5B', '#fff'],
  release: ['#F9A558', '#fff'],
  publisher: ['#AB7DF8', '#fff'],
  key: ['', '#fff'],
  artwork: ['', '#fff'],
};

type LabelProps = {
  tagType: Props['type'];
  shadow?: string;
};

const Label = styled('div')<LabelProps>`
  border-raidus: 2px 0 0 2px;
  background: ${p => typeColor[p.tagType][0]};
  color: ${p => typeColor[p.tagType][1]};
  padding: 0 0.5rem;
  ${p => shadowStyle(p.shadow, '#888')};
`;

type ValueProps = {
  shadow?: string;
};

const Value = styled('div')<ValueProps>`
  padding: 0 0.5rem;
  ${p => shadowStyle(p.shadow, '#eee')};
`;

const Tag = styled(TagContainer)<Props>`
  font: 500 0.6875rem 'Roboto Mono';
  line-height: 1.375rem;

  border: 1px solid ${p => typeColor[p.type][0]};
  border-radius: 2px;

  display: flex;

  &:focus {
    outline: none;
  }
`;

export default Tag;
