import React from 'react';
import styled from '@emotion/styled';

type Props = {
  bpm: string | null;
};

const BpmText = ({bpm}: Props) => {
  const bpmNum = Number(bpm);

  return (
    <React.Fragment>
      {isNaN(bpmNum) ? bpm : <Bpm>{bpmNum.toFixed(2)}</Bpm>}
    </React.Fragment>
  );
};

const Bpm = styled('span')`
  font-size: 13.5px;

  &:after {
    content: 'BPM';
    font-size: 9px;
    margin-bottom: -2px;
    margin-left: 0.25rem;
    color: #999;
  }
`;

export default BpmText;
