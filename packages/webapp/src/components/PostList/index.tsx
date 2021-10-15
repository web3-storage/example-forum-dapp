import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { ForumAPI, Post } from "../../api/forum";
import { postQueryKeys } from "../../api/queries";
import PostHeader from "../PostHeader";
import styles from './postlist.module.css'

interface Props {
    api: ForumAPI
}

export default function PostList(props: Props) {
    const { api } = props

    const opts = { includeScore: true, includeCommentCount: true}
    const queryKey = postQueryKeys.recentPostsWithOptions(opts)
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
        <PostHeader post={p} />
      </div>
    ))

    return (
        <div>
            {isLoading && 'fetching posts...'}
            {isError && `Error: ${error}`}
            {!isLoading && empty && `There's nothing here yet... why not submit something?`}
            {postViews}
        </div>
    )
}


