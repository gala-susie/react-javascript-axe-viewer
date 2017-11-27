import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';

export default class RowRenderer extends Component {
  constructor(props) {
    super(props);
  }
  
  setScrollLeft = (scrollBy) => {
    // if you want freeze columns to work, you need to make sure you implement this as a pass through prop
    this.row.setScrollLeft(scrollBy);
  }

  getRowStyle = () => {
    return {
      color: this.getRowBackground()
    };
  }

  getRowBackground = () => {
    return this.props.row.qty < 0 ?  'red' : 'green';
  }
  
  render() {
    return (<div style={this.getRowStyle()}><Row ref={ node => this.row = node } {...this.props}/></div>);
  }
}