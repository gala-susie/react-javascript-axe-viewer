import { Modal, Checkbox, FormGroup} from 'react-bootstrap';
import React, { Component } from 'react';

export default class HideColsModal extends Component {
  
  createCheckBoxItem = (item) => {
    return (
      <Checkbox 
        key={item.key}
        value={item.name} 
        onClick={this.onCheckboxClick} 
        checked={item.visible}
      >
        {item.title}
      </Checkbox>
    )
  }
  
  onCheckboxClick = (e) => {  
    var key = e.target.value;
    this.props.clickCol(key);
  }
  
  render() {
    var bigThis = this;
    
    return (
      <Modal show={this.props.showModal} onHide={this.props.close} bsSize="small">
          <Modal.Header closeButton>
            <Modal.Title>Choose Columns</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FormGroup>
              {
                this.props.cols.map(function (listValue) { 
                  return bigThis.createCheckBoxItem(listValue);
                }) 
              }
            </FormGroup>
          </Modal.Body>
        </Modal>
    )
  }
}