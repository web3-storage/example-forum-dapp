import { Link } from 'react-router-dom'
import styles from './footer.module.css'

const Footer = () => {
    return <footer className={styles.footer}>
        <div className={styles.links}>
            <Link to="/about">About this app</Link>
            {' | '}
            <a href="https://github.com/web3-storage/example-forum-dapp">GitHub</a>
            {' | '}
            <a href="https://protocol.ai/join/">Join Protocol Labs</a>
        </div>
    </footer>
}

export default Footer
