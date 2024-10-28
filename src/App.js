import React from "react";
import { Route, Switch } from "react-router-dom";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { Projects } from "./components/Projects";

function App() {
  return (
    <div className="App">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/projects" component={Projects} />
      </Switch>
    </div>
  );
}

export default App;
