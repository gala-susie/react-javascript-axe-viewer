import React, { Component } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import {Navbar, Nav, NavItem} from 'react-bootstrap';

import Grid from './grid';
import Login from './Login';

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      loggedIn: false,
      height: 500
    }
  }
  
  componentDidMount() {
    window.onresize = this.resize;
  }
  
  resize = () => {
    let newHeight = window.innerHeight - 80;
    newHeight = newHeight * 0.9;
    this.setState({height: newHeight})
  }

  login = (username) => {
    this.setState({loggedIn: true, user: username})
  }
  
  logout = () => {
    this.setState({loggedIn: false, user: ''});
  }

  render() {
    if (this.state.loggedIn) {
      return (
        <div className="App">
          <Navbar inverse>
            <Navbar.Header>
              <Navbar.Brand>
                Axe-Viewer
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Nav pullRight>
              <NavItem eventKey={1} href="/">
                Logout
              </NavItem>
              <Navbar.Text> 
               Signed in as: {this.state.user} 
              </Navbar.Text>
            </Nav>              
          </Navbar>
          <Grid user={this.state.user} height={this.state.height}/>
        </div>
      );
    } else {
      return (
        <Login login={this.login}/>
      )
    }
  }
}

export default App;