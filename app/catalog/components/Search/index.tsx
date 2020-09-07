import React from 'react';
import styled from '@emotion/styled';
import css from '@emotion/css';
import nearley from 'nearley';

import {SearchToken} from 'app/catalog/types';

import grammar from './grammar.ne';
import lexer from './lexer';
import Tag from './Tag';

type Props = {};

type State = {
  content: string;
  data: any;
};

class Search extends React.Component<Props, State> {
  state: State = {
    content: '',
    data: [],
  };

  componentDidMount() {
    document.addEventListener('selectionchange', this.handleSelection);
  }

  componentWillUnmount() {
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  handleSelection = (e: Event) => {
    console.log(window.getSelection(), e);
  };

  handleInputUpdate = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault();

    this.setState({content: (e.target as HTMLDivElement).textContent!});

    console.log(window.getSelection());
  };

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({content: e.target.value});

  handleKeyUp = () => {};

  get content() {
    return this.state.content;
  }

  get parsedContent() {
    const searchParser = new nearley.Parser(grammar, {lexer});
    searchParser.feed(this.state.content);
    return searchParser.results[0] as SearchToken[];
  }

  renderTags = () =>
    this.parsedContent.map(token => {
      console.log(token);
      if (token.type === 'freeText') {
        return <Tag label={token.value} type="freeText" />;
      }

      if (token.type === 'filter') {
        return (
          <Tag
            label={`${token.key.type}:`}
            value={token.value?.value}
            type={token.key.type}
          />
        );
      }

      return null;
    });

  render() {
    console.log(this.parsedContent);

    return (
      <React.Fragment>
        <input value={this.content} onChange={this.handleChange} />

        <Input
          empty={!this.content}
          onInput={this.handleInputUpdate}
          onKeyUp={this.handleKeyUp}
          suppressContentEditableWarning
          contentEditable
        >
          {this.renderTags()}
        </Input>
      </React.Fragment>
    );
  }
}

const emptyStateStyle = css`
  &:before {
    position: absolute;
    padding: 0 0.5rem;
    font: 500 0.6875rem 'Roboto Mono';
    line-height: 1.5rem;
    content: 'Search 2864 tracks across 23 genres';
    color: #888;
  }
`;

const Input = styled('div')<{empty: boolean}>`
  display: grid;
  grid-auto-columns: max-content;
  grid-auto-flow: column;
  grid-gap: 0.75rem;

  line-height: 1.5rem;
  height: 2.5rem;
  padding: 0.5rem 0.5rem;

  border: 1px solid #caced3;
  border-radius: 2px;

  &:focus {
    outline: none;
  }

  ${p => p.empty && emptyStateStyle}
`;

export default Search;
