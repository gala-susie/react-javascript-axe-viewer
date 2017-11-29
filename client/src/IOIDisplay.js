import { Modal } from 'react-bootstrap';
import React, { Component } from 'react';
import update from 'immutability-helper';

import NoZeroFormatter from './NoZeroFormatter';

// TODO: change below consts to imports
const ReactDataGrid = require('react-data-grid');
const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

export default class IOIDisplay extends Component {
  constructor(props) {
    super(props);  
    
    this._columns = [
      { key: 'username', name: 'User', filterable: true, resizable: true,  sortable: true, editable: true, formatter: NoZeroFormatter},
      { key: 'qty', name: 'Qty', filterable: true, resizable: true, sortable: true, editable: true, formatter: NoZeroFormatter},
      { key: 'message', name: 'Message', filterable: true, resizable: true, sortable: true, editable: true, formatter: NoZeroFormatter}
    ];
        
    this.state = {
      user: this.props.user,
      interestLevel: ''
    } 
  }
  
  componentDidMount() {
    var urlPath = 'api/getOne?code=' + this.props.code;
    fetch(urlPath)
      .then(res => res.json())
      .then(rows => this.setState({ rows }));
  }
  
  handleGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    // prevent editing multiple rows at once or row with different user
    if (fromRow !== toRow) {
      alert("Can't edit multiple rows at once.");
      return;
    } else if (this.state.rows[fromRow].username !== this.state.user) { 
      console.log(this.state.rows[fromRow].username);
      console.log(this.state.user);
      alert("Only the owner of the row can edit it.");
      return; 
    }
    
    let rows = this.state.rows.slice();

    for (let i = fromRow; i <= toRow; i++) {
      let rowToUpdate = rows[i];
      let updatedRow = update(rowToUpdate, {$merge: updated});
      rows[i] = updatedRow;
    }
    
    this.setState({ rows }, () => {      
      // TODO: Check that qty is a number before allow save
      // otherwise alert?
    
      fetch('api/updateIOI', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: this.state.rows[fromRow].id,
          username: this.state.user,
          qty: this.state.rows[fromRow].qty,
          message: this.state.rows[fromRow].message,
          parent: this.props.code
        })
      });
      
      this.props.notifyServer({type: 'update', code: this.props.code, countChange: this.state.rows[fromRow].qty });
    }); // end of setState callback
  }
  
  getSize =() => {
    return this.getRows().length;
  }
  
  getRows = () => {
    return Selectors.getRows(this.state);    
  }
  
  rowGetter = (i) => {
    let rows = this.getRows();
    return rows[i];
  }
  
  handleFilterChange = (filter) => {
    let newFilters = Object.assign({}, this.state.filters);
    if (filter.filterTerm) {
      newFilters[filter.column.key] = filter;
    } else {
      delete newFilters[filter.column.key];
    }
    this.setState({ filters: newFilters });
  }
  
  onClearFilters = () => {
    this.setState({filters: {} });
  }
  
  handleGridSort = (sortColumn, sortDirection) => {
    const comparer = (a, b) => {
      if (sortDirection === 'ASC') {
        return (a[sortColumn] > b[sortColumn]) ? 1 : -1;
      } else if (sortDirection === 'DESC') {
        return (a[sortColumn] < b[sortColumn]) ? 1 : -1;
      }
    };

    const rows = sortDirection === 'NONE' ? this.state.originalRows.slice(0) : this.state.rows.sort(comparer);

    this.setState({ rows });
  }
 
  render() {
    return  (
        <Modal.Body>
          <div>
          <ReactDataGrid
              onGridSort={this.handleGridSort}
              columns={this._columns}
              rowGetter={this.rowGetter}
              rowsCount={this.getSize()}
              minHeight={200}
              toolbar={<Toolbar enableFilter={true}/>}
              onAddFilter={this.handleFilterChange}
              onClearFilters={this.onClearFilters}
              enableCellSelect={true}
              onGridRowsUpdated={this.handleGridRowsUpdated}
            />
          </div>
        </Modal.Body>
    );
  }
}  