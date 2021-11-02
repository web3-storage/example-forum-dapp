import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import styles from './app.module.css'
import Login from '../Login'
import Logout from '../Logout'
import Home from '../Home'
import About from "../About";
import AccountSettings from "../AccountSettings";

import { ChainContextProvider } from '../../chain/context';
import { useEagerConnect, useReadonlyConnection } from "../../chain/hooks";
import Submit from "../Submit";
import { ApiContextProvider } from "../../api/context";
import ItemDetails from "../ItemDetails";
import { QueryClient, QueryClientProvider } from "react-query";


function Routes() {
  return <Switch>
    <Route exact path='/'>
      <Home />
    </Route>
    <Route path='/newest'>
      <Home />
    </Route>
    <Route path='/about'>
      <About />
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
    <Route path='/items/:itemId'>
      <ItemDetails />
    </Route>
    <Route path='/account'>
      <AccountSettings />
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

const queryClient = new QueryClient()

export default function () {
  return (
    <ChainContextProvider>
      <ApiContextProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ApiContextProvider>
    </ChainContextProvider>
  )
}
