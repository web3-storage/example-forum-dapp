import { useEffect, useState } from "react";
import { ForumAPI, Post } from "../../api/forum";


interface Props {
    api: ForumAPI
}

export default function PostList(props: Props) {
    const { api } = props
    const [posts, setPosts] = useState<Post[]>([])
    const [fetching, setFetching] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string|undefined>()

    useEffect(() => {
        setFetching(true)
        api.getRecentPosts().then(_posts => {
            setPosts(_posts)
            console.log('got posts', _posts)
            setFetching(false)
        })
        .catch(err => {
            console.error(err)
            setErrorMessage(err.message)
            setFetching(false)
        })
    }, [])

    const empty = posts.length === 0
    const postViews = posts.map(PostEntry)

    return (
        <div>
            {fetching && 'fetching posts...'}
            {errorMessage && `Error: ${errorMessage}`}
            {empty && `There's nothing here yet... why not submit something?`}
            {postViews}
        </div>
    )
}


function PostEntry(post: Post) {
    // TODO: show votes, etc
    return (
        <div key={'post-' + post.id.toString()}>
            {post.content.title}
        </div>
    )
}