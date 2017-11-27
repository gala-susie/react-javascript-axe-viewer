import IOIModal from './IOIModal';
import NoZeroFormatter from './NoZeroFormatter';
import HideColsModal from './HideColsModal';
import update from 'immutability-helper';
import React, { Component } from 'react';
import ReactDataGrid from 'react-data-grid';
import { Button } from 'react-bootstrap';
import * as d3 from "d3";
import io from 'socket.io-client';

var socket = io();
// TODO: turn the below requires into imports
const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');
const { DraggableHeader: { DraggableContainer }} = require('react-data-grid-addons');
const { Menu: { ContextMenu, MenuItem } } = require('react-data-grid-addons');

export default class Grid extends Component {
  constructor(props) {
    super(props); 
            
    const columnSetup = [
      { key: 'security', title: 'Name', name: 'Name', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, width: 70, 
       events: {
          onDoubleClick: function(ev, args) {
            console.log('The user entered edit mode on title column with rowIdx: ' + args.rowIdx + ' & rowId: ' + args.rowId);
          }
        }
      },
      { key: 'fullName', title: 'Full Name', name: 'Full Name', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, width: 300 },
      { key: 'sedol', title: 'SEDOL', name: 'SEDOL', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, width: 100 },
      { key: 'isin', title: 'ISIN', name: 'ISIN', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, width: 120 },
      { key: 'bbg', title: 'Bloomberg', name: 'BBG', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, width: 100 },
      { key: 'market', title: 'Market', name: 'Market', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, width: 60 },
      { key: 'index', title: 'Index', name: 'Index', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, width: 100 },
      { key: 'sod', title: 'Start of Day Availability', name: 'SOD Availability', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, formatter: NoZeroFormatter, width: 140},
      { key: 'qty', title: 'Current Availability', name: 'Current Availability', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, formatter: NoZeroFormatter, width: 140},
      { key: 'ioi', title: 'Indication of Interest', name: 'IOI', filterable: true, visible: true, draggable: true, sortable: true, resizable: true, formatter: NoZeroFormatter, width: 140,  
        events: {
          onDoubleClick: this.setup
        } 
      }];
    
    this.state = {
      rows: [],
      filters: {},
      hist: {},
      columns: columnSetup
    }
  }
  
  componentDidMount() {
    // bind our column resize method to the react-data-grid
    this.grid.onColumnResize = this.handleColResize;

    this.createRows();
    
    var bigThis = this;
    socket.on('update', function(data) {
      bigThis.updateIOIFromSockets(data);
    });
    socket.on('new', function(data) {
      bigThis.newIOIFromSockets(data);
    })
        
    // Opens the filter panel of the react-data-grid
    this.grid.onToggleFilter();
  }
  
  handleColResize = (index, width) => {
    const newColList = update(this.state.columns, {[index]: {width: { $set: width}}});
    
    this.setState({
      columns: newColList
    })
  }

  newIOIFromSockets = (payload) => {
    // update the ioi count in rows
    var index = this.state.rows.findIndex((x) => { return x.security === payload.code });
    const updatedRows = update(this.state.rows, {[index]: {ioi: {$apply: function(x) {return (x) ? parseInt(x, 10) + parseInt(payload.countChange, 10) : payload.countChange}}}});

    // also update it in originalRows
    var index2 = this.state.originalRows.findIndex((x) => { return x.security === payload.code });
    const updatedOrig = update(this.state.originalRows, {[index2]: {ioi: {$apply: function(x) {return (x) ? parseInt(x, 10) + parseInt(payload.countChange, 10) : payload.countChange}}}});

    this.setState({rows: updatedRows, originalRows: updatedOrig});
  }
  
  updateIOIFromSockets = (payload) => {
    
    // update the ioi count in rows
    var index = this.state.rows.findIndex((x) => { return x.security === payload.code });
    const newRows = update(this.state.rows, {[index]: {ioi: {$set: payload.countChange}}});

    // also update it in originalRows
    var index2 = this.state.originalRows.findIndex((x) => { return x.security === payload.code });
    const updateOrig = update(this.state.originalRows, {[index2]: {ioi: {$set: payload.countChange}}});

    this.setState({rows: newRows, originalRows: updateOrig});
  }

  notifyServer = (input) => {
    if (input.type === 'update') {
      socket.emit('saveUpdate', {
        code: input.code,
        countChange: input.countChange
      }); 
    } else if (input.type === 'new') {
      socket.emit('saveNew', {
        code: input.code,
        countChange: input.countChange 
      })
    }  
  }
  
  setup = (ev, args) => { 
    this.setState({
      showIOI: true,
      ioiRow: args.rowId,
      ioiCode: this.state.originalRows[args.rowId - 1].security
    })
  }
  
  close = () => {
    this.setState({ showIOI: false, addIOI: false, showHideCols: false });
  }
  
  clickCol = (col) => {
    const colIndex = this.state.columns.findIndex(
      i => i.name === col
    );
    
    var newCols = this.state.columns;
    
    if (this.state.columns[colIndex].name === col) {
      newCols = update(this.state.columns, {[colIndex]: {visible: {$set: !this.state.columns[colIndex].visible}}});
    }
    
    this.setState({
      columns: newCols
    })
  }
    
  createRows = () => {
    const sodOpt = [120000, 2000000, 98000, 30000, -32000, 1000, 302000, 65000, 77000, 1000000,-2000, -38800, -1000, -7200, -210000];
        
    var file = '/RussellRefData.csv';
    
    fetch('/api/sums').then(res => res.json())
          .then(sums => this.setState({sums}))
          .then(x =>
      d3.csv(file, (data) => {
        let rows = [];

        for (let i = 1; i < data.length; i++) {
          const rand = Math.floor(Math.random() * sodOpt.length);
          const rand2 = Math.floor(Math.random() * sodOpt.length);

          rows.push({
            id: i,
            security: data[i]['Code'],
            isin: data[i]['ISIN'],
            sedol: data[i]['SEDOL'],
            bbg: data[i]['Bloomberg'],
            fullName: data[i]['Company'],
            market: data[i]['Market'],
            index: data[i]['Index'],
            qty: sodOpt[rand2],
            ioi: this.state.sums[data[i]['Code']],
            sod: sodOpt[rand]
          });
        }

        this.setState({
          rows: rows,
          originalRows: rows.slice()
        });
        // Need the rows.slice() for originalRows to decouple them. Otherwise any changes to rows affects originalRows.
      
      }) //close d3.csv
    ); //close fetch
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
      if (a[sortColumn] == null) {
          return 1;
        } else if (b[sortColumn] == null) {
          return -1;
        }
      else if (sortDirection === 'ASC') {
        return (a[sortColumn] > b[sortColumn]) ? 1 : -1;
      } else if (sortDirection === 'DESC') {
        return (a[sortColumn] < b[sortColumn]) ? 1 : -1;
      }
    };

    const rows = sortDirection === 'NONE' ? this.state.originalRows.slice() : this.state.rows.sort(comparer);
    
    this.setState({ rows });
  }
  
  onHeaderDrop = (source, target) => {
    const columnSourceIndex = this.state.columns.findIndex(
      i => i.key === source
    );
    const columnTargetIndex = this.state.columns.findIndex(
      i => i.key === target
    );
    
    const stateCopy = Object.assign({}, this.state);

    stateCopy.columns.splice(
      columnTargetIndex,
      0,
      stateCopy.columns.splice(columnSourceIndex, 1)[0]
    );

    const emptyColumns = Object.assign({},this.state, { columns: [] });
    this.setState(
      emptyColumns
    );

    const reorderedColumns = Object.assign({},this.state, { columns: stateCopy.columns });
    this.setState(
      reorderedColumns
    );
  }
  
  hideCols = (columns) => {
    var newCols = this.state.columns;
    
    for (var j = 0; j < this.state.columns.length; j ++) {
      for (var i = 0; i < columns.length; i++) {
        if (this.state.columns[j].key === columns[i]) {
          newCols = update(newCols, {[j]: {visible: {$set: false}}})
        }
        else if (!columns.includes(this.state.columns[j].key)){
          newCols = update(newCols, {[j]: {visible: {$set: true}}})
        }
      }
      if (columns.length === 0) {
        newCols = update(newCols, {[j]: {visible: {$set: true}}})
      }
    }
    
    this.setState({
      columns: newCols,
      showHideCols: false
    });
  }
  
  createIOI = (e, data) => {
    // use data.rowIdx to get security name to pull up relevant modal
    this.setState({
      addIOI: true,
      showIOI: true,
      ioiRow: data.rowIdx,
      ioiCode: this.state.rows[data.rowIdx].security
    });
    
  }
  
  render() {
    const cols = this.state.columns.filter(column => column.visible === true);
    
    return  (
      <div>
        <DraggableContainer 
          onHeaderDrop={this.onHeaderDrop}>
          <ReactDataGrid
            ref={(grid) => { this.grid = grid; }}
            onGridSort={this.handleGridSort}
            columns={cols}
            rowGetter={this.rowGetter}
            rowsCount={this.getSize()}
            minHeight={this.props.height}
            toolbar={<Toolbar enableFilter={true}/>}
            onAddFilter={this.handleFilterChange}
            onClearFilters={this.onClearFilters}
            contextMenu={<MyContextMenu onCreateIOI={this.createIOI} />}
          />
        </DraggableContainer>
        <Button onClick={() => {this.setState({showHideCols: true})}}> 
          Hide/Show columns
        </Button>
        <Button onClick={() => {
           this.grid.onToggleFilter();
           setTimeout(this.grid.onToggleFilter, 10);
        }}>
          Clear all Filters 
        </Button>
        <HideColsModal 
          clickCol={this.clickCol}
          showModal={this.state.showHideCols} 
          cols={this.state.columns} 
          close={this.close}
        />
        
        <IOIModal user={this.props.user} close={this.close} show={this.state.showIOI} row={this.state.ioiRow} code={this.state.ioiCode}
        notifyServer={this.notifyServer} addIOI={this.state.addIOI}/>
      </div>
    );
  }
}

// TODO: move contextMenu to its own file
// Create the context menu.
// Use this.props.rowIdx and this.props.idx to get the row/column where the menu is shown.
const MyContextMenu = React.createClass({
  propTypes: {
    onCreateIOI: React.PropTypes.func.isRequired,
  },

  onCreateIOI(e, data) {
    if (typeof(this.props.onCreateIOI) === 'function') {
      this.props.onCreateIOI(e, data);
    }
  },

  render() {
    return (
      <ContextMenu>
        <MenuItem data={{rowIdx: this.props.rowIdx, idx: this.props.idx}} onClick={this.onCreateIOI}> New IOI</MenuItem>
      </ContextMenu>
    );
  }
});