import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import styles from './app.module.css'
import Login from '../Login'
import Logout from '../Logout'
import Home from '../Home'
import { ChainContextProvider } from '../../chain/context';
import { useAutoFaucet, useEagerConnect, useReadonlyConnection } from "../../chain/hooks";
import Submit from "../Submit";
import { ApiContextProvider } from "../../api/context";


function Routes() {
  return <Switch>
    <Route exact path='/'>
      <Home />
    </Route>
    <Route path='/news'>
      <Home />
    </Route>
    <Route path='/login'>
      <Login />
    </Route>
    <Route path='/submit'>
      <Submit />
    </Route>
    <Route path='/logout'>
      <Logout />
    </Route>
  </Switch>
}

function App() {
  useReadonlyConnection()
  useEagerConnect()
  useAutoFaucet()

  return (
    <Router>
      <div className={styles.app}>
        <Routes />
      </div>
    </Router>
  )
}

export default function () {
  return (
    <ChainContextProvider>
      <ApiContextProvider>
        <App />
      </ApiContextProvider>
    </ChainContextProvider>
  )
}
