import { useApiContext } from "../../api/context"
import Layout from "../Layout"
import PostList from "../PostList"

const Home = () => {
    const { api } = useApiContext()
    if (!api) {
        return (
        <Layout>
            <div>
                connecting to smart contract...
            </div>
         </Layout>
        )
    }



    return (
        <Layout>
            <PostList api={api} />
        </Layout>
    )
}

export default Home