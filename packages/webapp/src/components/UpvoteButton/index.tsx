import grayArrow from '../../images/grayarrow.gif'


export default function UpvoteButton(props: { onClick: () => void }) {
  return <a href='#' onClick={props.onClick}>
    <img src={grayArrow} />
  </a>
}
