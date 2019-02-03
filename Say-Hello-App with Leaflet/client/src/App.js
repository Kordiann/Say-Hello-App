import React, { Component } from 'react';
import L from 'leaflet';
import Joi from 'joi';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, Button, CardTitle, CardText, FormGroup } from 'reactstrap';
import { Form, Label, Input } from 'reactstrap';
import userLocationUrl from './user_location.svg'
import messageLocationUrl from './message_location.svg'

import './App.css';

const myIcon = L.icon({
  iconUrl: userLocationUrl,
  iconSize: [42, 82],
  iconAnchor: [21, 82],
  popupAnchor: [-5, -50]
});

const messageIcon = L.icon({
  iconUrl: messageLocationUrl,
  iconSize: [42, 82],
  iconAnchor: [21, 82],
  popupAnchor: [-5, -50]
});

const schema = Joi.object().keys({
  name: Joi.string().invalid(null).regex(/^[a-zA-Z0-9]{1,30}/).required(),
  message: Joi.string().invalid(null).min(5).max(100).required(),
});

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api/v1/messages' : 'production-url-here';

class App extends Component {
  state = {
    location: {
      lat: 0,
      lng: 0,
    },
    haveUsersLocation: false,
    zoom: 2,
    userMessage: {
      name: '',
      message: '',
    },
    sendingMessage: false,
    sentMessage: false,
    messages: [],
  }

  componentDidMount() {
    fetch(API_URL)
      .then(res => res.json())
      .then(messages => {
        const haveSeenLocation = {};
        messages = messages.reduce((all, message) => {
          const key = `${message.latitude.toFixed(4)}${message.longitude.toFixed(4)}`;
          if(haveSeenLocation[key]) {
            haveSeenLocation[key].otherMessages = haveSeenLocation[key].otherMessages || [];
            haveSeenLocation[key].otherMessages.push(message);
          }else{
            haveSeenLocation[key] = message;
            all.push(message);
          }
          return all;
        }, []);
        this.setState({
          messages
        });
      });

    navigator.geolocation.getCurrentPosition((position) => {
      this.setState({
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        haveUsersLocation: true,
        zoom: 13,
      });
    }, () => {
      console.log('Problem with getting location');
      fetch('https://ipapi.co/json')
      .then( res => res.json()) 
      .then(location => {
        this.setState({
          location: {
            lat: location.latitude,
            lng: location.longitude
          },
          haveUsersLocation: true,
          zoom: 13,
        });
      })
    });
  }

  formIsValid = () => {
    const userMessage = {
      name: this.state.userMessage.name,
      message: this.state.userMessage.message,
    };
    const result = Joi.validate(userMessage, schema);
    
    if(!result.error && this.state.haveUsersLocation){
      return true;
    }else return false;
  }

  formSubmitted = (event) => {
    this.setState({
      sendingMessage: true,
    });
    event.preventDefault();
    if(this.formIsValid()) {
      fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: this.state.userMessage.name,
          message: this.state.userMessage.message,
          latitude: this.state.location.lat,
          longitude: this.state.location.lng,
        })
      }).then(res => res.json())
      .then(message => {
        console.log(message);
        setTimeout(() => {
          this.setState({
            sendingMessage: false,
            sentMessage: true,
          });
        }, 2000);
      });
    }
  }

  valueChanged = (event) => {
    const { name, value } = event.target;
    this.setState((prevState) => ({
      userMessage: {
        ...prevState.userMessage,
        [name]: value,
      }
    }));
  }

  render() {
    const position = [this.state.location.lat, this.state.location.lng]
    return (
    <div>
      <Map className="map" center={position} zoom={this.state.zoom}>
          <TileLayer
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          { 
            this.state.haveUsersLocation ?
            <Marker  
              position={position}
              icon={myIcon} >
            </Marker> : ''
          }
          { this.state.messages.map(message => ( 
            <Marker  
              key={ message._id }
              position={ [message.latitude, message.longitude] }
              icon={messageIcon}>
              <Popup>
                <p><em>{ message.name }: </em> { message.message }</p>
                { message.otherMessages ? message.otherMessages.map(message => <p key={message._id}><em>{ message.name }: </em> { message.message }</p>) : '' }
              </Popup>
            </Marker>
          ))}
      </Map>
    <Card data-aos="fade-up" data-aos-duration="1000" body className="message-form">
      <CardTitle className="black">Welcome to GuestMap!</CardTitle>
      <CardText className="black">Leave a message with your location!</CardText>
      <CardText className="black">Thanks for stopping by!</CardText>
      { 
        !this.state.sendingMessage && !this.state.sentMessage && this.state.haveUsersLocation ?
        <Form onSubmit={this.formSubmitted}>
          <FormGroup>
          <Label className="black" for="name">Name</Label>
          <Input 
           className="black"
           onChange={this.valueChanged}
           type="text" 
            name="name" 
            id="name" 
           placeholder="Enter your name" />
          </FormGroup>
          <FormGroup>
          <Label className="black" for="message">Message</Label>
         <Input 
           className="black"
           onChange={this.valueChanged}
           type="textarea" 
           name="message" 
            id="message" 
            placeholder="Enter your message" />
         </FormGroup>
          <Button type="submit" disabled={!this.formIsValid()} color="info">Send</Button>
        </Form> : 
        this.state.sendingMessage || !this.state.haveUsersLocation ? 
        <img alt='' 
        src="https://digitalsynopsis.com/wp-content/uploads/2016/06/loading-animations-preloader-gifs-ui-ux-effects-18.gif" 
        align="center" 
        width="200px" 
        height="150px" 
        margin="auto"
        frameBorder="0"></img> :
        <CardText>Thanks for leave Message!</CardText>
      }
      </Card>
    </div>
  
    )
  }
}

export default App;
