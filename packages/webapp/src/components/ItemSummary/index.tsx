import { Link } from "react-router-dom"
import { Item, Upvote } from "../../api/forum"
import styles from './itemsummary.module.css'
import { accountDisplayName } from "../../utils"
import { useVoteForItem } from "../../api/queries"
import { useApiContext } from "../../api/context"
import UpvoteButton from "../UpvoteButton"

export default function ItemSummary(props: {item: Item}) {
  const { item } = props
  const score = item.score || 0
  const numComments = item.childIds.length
  
  const blockno = item.createdAtBlock.toString()
  const author = accountDisplayName(item.author)

  const { api } = useApiContext()
  const voteMutation = useVoteForItem()

  const upvoteClicked = () => {
    if (!api) {
      console.warn('no connection to contract')
      return
    }
    voteMutation.mutate({ api, itemId: item.id, vote: Upvote })
  }

  const { isLoading, isSuccess } = voteMutation
  const showUpvoteButton = !isLoading && !isSuccess

  let title
  if (item.content.itemKind === 'POST') {
    title = item.content.title
  }

  return (
      <div 
        className={styles.container}
        key={'item-summary-' + item.id.toString()}>
          {showUpvoteButton && <UpvoteButton onClick={upvoteClicked} />}

          <div className={styles.infoRows}>
            {title &&
              <div className={styles.postTitleRow}>
              <Link to={`/items/${item.id}`}>
                {title}
              </Link>
            </div>
            }

            <div className={styles.postDetailsRow}>
              {score} points by {author} at block #{blockno} | <Link to={`/items/${item.id}`}>{numComments} comments</Link>
            </div>
          </div>
      </div>
  )
}