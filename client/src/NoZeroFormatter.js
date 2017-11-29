import React, { Component } from 'react';

export default class NoZeroFormatter extends Component {
  
  addCommas = (val) => {
    return (val + '').replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  }
  
  render () {
    const style = (this.props.value < 0) ? "neg" : "";
      
    const value = (this.props.value === 0 || this.props.value === "") ? '-' : this.addCommas(this.props.value);

    return (
      <div className={style}>
      {value}
      </div>
    );
  }
}