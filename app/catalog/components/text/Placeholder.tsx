import styled from '@emotion/styled';

const Placeholder = styled('div')<{text: string}>`
  color: #bbb;
  text-transform: uppercase;
  font-size: 0.9em;

  &:after {
    content: '${p => p.text}';
  }
`;

export default Placeholder;
