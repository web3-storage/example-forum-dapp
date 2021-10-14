import React from "react";
import Footer from '../Footer'
import Header from '../Header'

import styles  from './layout.module.css'

const Layout = (props: { children: React.ReactNode }) => {
  return <div className={styles.container}>
    <Header />

    {props.children}

    <div className={styles.spacer} />

    <Footer />
  </div>
}

export default Layout
