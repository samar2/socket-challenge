import React, { Component } from "react";
import io from "socket.io-client";
import "./App.css";

class App extends Component {
  state = {
    isConnected: false,
    id: null,
    users: [],
    text: "",
    name: null,
    messages: []
  };
  socket = null;

  componentWillMount() {
    this.socket = io("https://localhost:8000");

    //this.socket.on("log", stuff => console.warn("LOG", stuff));

    this.socket.on("connect", () => {
      this.setState({ isConnected: true });
    });

    this.socket.on("disconnect", () => {
      this.setState({ isConnected: false });
    });

    this.socket.on("pong!", additionalStuff => {
      console.log("server answered!", additionalStuff);
    });

    this.socket.on("youare", answer => {
      if (!this.state.id) {
        this.setState({ id: answer.id });
      }
    });

    this.socket.on("room_message", message => {
      this.setState({ messages: [...this.state.messages, message] });
      console.log(message);
    });

    this.socket.on("room", old_messages => console.log(old_messages));

    this.socket.on("peeps", peeps => this.setState({ users: peeps }));
    this.socket.on("new connection", id =>
      {console.log("here",id)
      const users = [...this.state.users]
      users.push(id);
      console.log("users",users)
      this.setState({users})}
    );
    this.socket.on("next", text => console.log(text));
    this.socket.on("new disconnection", id =>
      {console.log("disconnected",id)
      this.setState({ users: this.state.users.filter(_id => _id !== id) })}
    );
    this.socket.emit("whoami");
  }

  componentWillUnmount() {
    this.socket.close();
    this.socket = null;
  }

  onInputChange = (evt) => {
    this.setState({text:evt.target.value})
  }
  onNameSubmit= evt => {
    evt.preventDefault();
    const form = evt.target
    const name = form.userName.value
    this.setState({ name});
  };
  onAnswerPress = () => {
    this.socket.emit("answer", this.state.text);
  };

  onTestChatPress = () => {
    const { text } = this.state;
    this.socket.emit("message", text);
    this.setState({ text: "" });
  };

  onSendChatPress = () => {
    const { text, id } = this.state;
    const name = this.state.name;
    const message = { text, id, name };
    this.socket.emit("message", message);
    this.setState({ text: "" });
  };

  render() {
    return (
      <div className="App">
        <div>
          status: {this.state.isConnected ? "connected" : "disconnected"}
        </div>
        <div>id: {this.state.id}</div>
        {!this.state.name ? (
          <div >
          <span >
          <form onSubmit={this.onNameSubmit}>
            <input type="text" name="userName"  />
            <button type="submit" >Set Name</button>
          </form></span></div>
        ) : (
          <></>
        )}
        <br/>
         <div class="container-fluid h-100">
          <div class="row justify-content-center h-100">
        <div class="col-md-4 col-xl-3 chat"><div class="card mb-sm-3 mb-md-0 contacts_card">
					<div class="card-header">
          <div className="user_info">
                      <span>Online User IDs</span>
                    </div>
					</div>
					<div class="card-body contacts_body">
						<ui class="contacts">
            { this.state.users.map(u=>
              	<li class="active">
                <div class="d-flex bd-highlight">
                
                    <span class="online_icon"></span>
                  
                  <div class="user_info">
                    <span>{u}</span>
                  </div>
                </div>
              </li>
              )}
					
					
					
						</ui>
					</div>
					<div class="card-footer"></div>
				</div></div>
       
            <div className="col-md-8 col-xl-6 chat">
              <div className="card">
                <div className="card-header msg_head">
                  <div className="d-flex bd-highlight">
                    
                    <div className="user_info">
                      <span>Group Chat</span>
                    </div>
                  </div>
                </div>

                <div className="card-body msg_card_body">
                  {this.state.messages.map(m =>
                    m.id === this.state.id ? (
                      <div className="d-flex justify-content-start mb-4">
                        <div className="user_info">
                          <span>{m.name}</span>
                        </div>
                        <div className="msg_cotainer">
                          {m.text}
                          <span className="msg_time">{m.date}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex justify-content-end mb-4">
                        <div className="msg_cotainer_send">
                          {m.text}
                          <span className="msg_time_send">{m.date}</span>
                        </div>
                        <div className="user_info">
                          <span>{m.name}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <div className="card-footer">
                  <div className="input-group">
                    <div className="input-group-append">
                      <span className="input-group-text attach_btn">
                        <i className="fas fa-paperclip"></i>
                      </span>
                    </div>
                    <textarea
                      name=""
                      className="form-control type_msg"
                      placeholder="Type your message..."
                      onChange={this.onInputChange}
                      value={this.state.text}
                    ></textarea>
                    <div className="input-group-append">
                      <span className="input-group-text send_btn">
                        <i className="fas fa-location-arrow">
                          {" "}
                          <button onClick={this.onSendChatPress} >
                            Send Chat
                          </button>
                        </i>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
