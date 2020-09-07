import React, {PureComponent} from 'react';

class ScrollLockList extends PureComponent {
  constructor() {
    super();
    this.disableScroll = this.disableScroll.bind(this);
    this.enableScroll = this.enableScroll.bind(this);
  }

  componentWillUnmount() {
    this.enableScroll();
  }

  disableScroll() {
    document.body.style.overflow = 'hidden';
  }

  enableScroll() {
    document.body.style.overflow = 'auto';
  }

  render() {
    return (
      <ul {...this.props} onMouseOver={this.disableScroll} onMouseOut={this.enableScroll}>
        {this.props.children}
      </ul>
    );
  }
}

export default ScrollLockList;
