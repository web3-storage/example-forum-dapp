import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import styles from './app.module.css'
import Footer from '../Footer'
import Header from '../Header'
import Home from '../Home'

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}


function Routes() {
  return <Switch>
    <Route path='/'>
      <Home />
    </Route>
  </Switch>
}

function App() {
  return (
    <Router>
      <div className={styles.app}>
        <div className={styles.container}>
          <Header />

          <Routes />

          <div className={styles.spacer} />
          <Footer />
        </div>
      </div>
    </Router>
  )
}

export default function () {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  )
}
