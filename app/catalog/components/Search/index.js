import React from 'react';
import styled from '@emotion/styled';

const KEYWORDS = ['artist', 'album', 'release', 'key', 'publisher', 'genre'];

class Search extends React.Component {
  state = {
    content: 'Whatever',
  };

  componentDidMount() {
    document.addEventListener('selectionchange', this.handleSelection);
  }

  componentWillUnmount() {
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  handleSelection = e => {
    console.log(e);
  };

  handleInputUpdate = e => {
    e.preventDefault();
    this.setState({ content: e.target.textContent });
  };

  get content() {
    return this.state.content;
  }

  render() {
    return (
      <Input
        onInput={this.handleInputUpdate}
        suppressContentEditableWarning
        contentEditable>
        {this.content}
      </Input>
    );
  }
}

const Input = styled('div')`
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  box-shadow: 0 1px 0 #fafafa;

  &:focus {
    outline: none;
    border: ;
  }
`;

export default Search;
