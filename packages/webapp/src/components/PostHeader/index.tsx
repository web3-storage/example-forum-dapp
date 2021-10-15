import { Link } from "react-router-dom"
import type { Post } from "../../api/forum"
import styles from './postheader.module.css'
import grayArrow from '../../images/grayarrow.gif'

function UpvoteButton(props: { onClick: () => void }) {
  return <a href='#' onClick={props.onClick}>
    <img src={grayArrow} />
  </a>
}

export default function PostHeader(props: {post: Post}) {
  const { post } = props
  const score = post.score || 0
  const numComments = post.numComments || 0
  
  const blockno = post.createdAtBlock.toString()

  // TODO: usernames?
  const author = post.author.substring(0, 6) + '...'

  const upvoteClicked = () => {
    console.log('TODO: implement upvotes')
  }

  return (
      <div 
        className={styles.container}
        key={'post-' + post.id.toString()}>
          <UpvoteButton onClick={upvoteClicked} />

          <div className={styles.infoRows}>
            <div className={styles.postTitleRow}>
              <Link to={`/posts/${post.id}`}>
                {post.content.title}
              </Link>
            </div>

            <div className={styles.postDetailsRow}>
              {score} points by {author} at block #{blockno} | <Link to={`/posts/${post.id}`}>{numComments} comments</Link>
            </div>
          </div>
      </div>
  )
}