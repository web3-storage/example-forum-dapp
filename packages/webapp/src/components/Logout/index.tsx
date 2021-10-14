import { Redirect } from "react-router";
import { useChainContext } from "../../chain/context";
import Layout from "../Layout";

export default function Logout() {
    const { loggedIn } = useChainContext()
    if (!loggedIn) {
        return <Redirect to='/' />
    }
    return (
        <Layout>
            To log out, disconnect your Ethereum account from this site.
        </Layout>
    )
}