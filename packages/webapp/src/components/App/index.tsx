import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import styles from './app.module.css'
import Login from '../Login'
import Home from '../Home'
import { ChainContextProvider } from '../../chain/context';
import { useEagerConnect, useReadonlyConnection } from "../../chain/hooks";


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
  </Switch>
}

function App() {
  useReadonlyConnection()
  useEagerConnect()

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
      <App />
    </ChainContextProvider>
  )
}
