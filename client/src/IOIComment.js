import { Modal, FormGroup, ControlLabel, FormControl} from 'react-bootstrap';
import React, { Component } from 'react';

export default class IOIComment extends Component {
 
  render() {
    return  (
        <Modal.Body>
            <label className="black-text pad-right"> Quantity </label>
            <input className="black-text" type="text" pattern="[0-9]*" onInput={this.props.handleInterestLevelChange} value={this.props.interestLevel} />
      
            <FormGroup controlId="form-controls-textarea">
              <ControlLabel className="black-text">Comment</ControlLabel>
              <FormControl type="text" name="comment" componentClass="textarea" placeholder="comment here" onChange={this.props.handleTextChange}/>
            </FormGroup>
        </Modal.Body>
    );
  }
}