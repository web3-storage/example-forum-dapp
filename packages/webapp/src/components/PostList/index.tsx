import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { ForumAPI, Post } from "../../api/forum";
import { recentPostQueryKeys } from "../../api/queries";
import ItemSummary from "../ItemSummary";
import styles from './postlist.module.css'

interface Props {
    api: ForumAPI
}

export default function PostList(props: Props) {
    const { api } = props

    const opts = { includeScore: true, includeCommentCount: true}
    const queryKey = recentPostQueryKeys.recentPostsWithOptions(opts)
    const { isLoading, isError, data, error } = 
        useQuery(queryKey, () => {
            console.log('fetching recent posts with options', opts)
            return api.getRecentPosts(opts)
        })

    let posts: Post[] = []
    if (!isLoading && !isError) {
        posts = data as Post[]
    }

    const empty = posts.length === 0

    // TODO: sort by score / creation time, etc
    const postViews = posts.map((p, i) => (
      <div className={styles.postEntry} key={`post-${p.id}`}>
        <span className={styles.rankNumber}>{`${i+1}.`}</span>
        <ItemSummary item={p} />
      </div>
    ))

    return (
        <div>
            {isLoading && 'fetching posts...'}
            {isError && `Error: ${error}`}
            {!isLoading && empty && 
              <span>
                There's nothing here yet... why not <Link to='/submit'>submit something?</Link>
              </span>}
            {postViews}
        </div>
    )
}


