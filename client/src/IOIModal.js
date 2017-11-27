import { Button, Modal} from 'react-bootstrap';
import React, { Component } from 'react';
import IOIComment from './IOIComment';
import IOIDisplay from './IOIDisplay';

export default class IOIModal extends Component {
  constructor(props) {
    super(props);  
    
    this.state = {
      user: this.props.user,
      interestLevel: '',
      comment: '',
      edit: false
    } 
  }
  
  componentDidMount() {
    fetch('/api/all')
      .then(res => res.json())
      .then(users => this.setState({ users }));
  }
  
  sendChanges = (comment) => { 
    fetch('api/saveIOI', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.state.user,
        qty: this.state.interestLevel,
        message: this.state.comment,
        parent: this.props.code
      })
    }); 
    
    this.setState({edit: false});
    
    if(this.props.addIOI) {
      this.props.close();
    }
    
    this.props.notifyServer({type: 'new', code: this.props.code, countChange: this.state.interestLevel});
  }
  
  handleInterestLevelChange(evt) {
    const interestLevel = (evt.target.validity.valid) ? evt.target.value : this.state.interestLevel;
    
    this.setState({ interestLevel });
  }

  handleTextChange(event) {
    let fieldName = event.target.name;
    let fieldVal = event.target.value;
    this.setState({[fieldName]: fieldVal}) //change back to nicer 'form' format when have time
  }
 
  render() {  
    const actionButton = (this.state.edit || this.props.addIOI) ? <Button bsStyle="primary" onClick={this.sendChanges}>Save changes</Button> : <Button bsStyle="primary" onClick={() => {this.setState({edit: true})}}>Add IOI</Button>
          
    const body = (this.state.edit || this.props.addIOI) ? <IOIComment handleInterestLevelChange={this.handleInterestLevelChange.bind(this)} handleTextChange={this.handleTextChange.bind(this)} interestLevel={this.state.interestLevel}/> : <IOIDisplay user={this.props.user} notifyServer={this.props.notifyServer} handleInterestLevelChange={this.handleInterestLevelChange} handleTextChange={this.handleTextChange} code={this.props.code}/>;
    
    return  (
      <Modal show={this.props.show} onHide={this.props.close}>  
        <Modal.Header>
          <Modal.Title className="blackText">Indication of Interest</Modal.Title>
        </Modal.Header>
        {body}
        <Modal.Footer>
          <Button onClick={this.props.close}>Close</Button>
          {actionButton}
        </Modal.Footer>
      </Modal>
    );
  }
}  