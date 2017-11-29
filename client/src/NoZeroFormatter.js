import React, { Component } from 'react';

export default class NoZeroFormatter extends Component {
  render () {
    let style = "";
    if (this.props.value < 0) {
      style = "neg";
    }
    
    const value = (this.props.value === 0 || this.props.value === "") ? '-' : this.props.value.toLocaleString();
    return (
      <div className={style}>
      {value}
      </div>
    );
  }
}