//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/Counters.sol";

contract Forum {
  using Counters for Counters.Counter;
  
  /**
    * @notice Represents a single forum post. 
    */
  struct Post {
    /// @notice Unique post id, assigned at post creation.
    uint256 id;

    /// @notice address of post author.
    address author;

    /// @notice IPFS CID of post content.
    string contentCID;
  }

  /// @notice Represents a comment attached to a forum post.
  struct Comment {
    /// @notice Unique comment id, assigned at comment creation.
    uint256 id;

    /// @notice address of comment author.
    address author;

    /// @notice Unique id of post this comment belongs to.
    uint256 postId;

    /// @notice IPFS CID of comment content.
    string contentCID;
  }

  /// @notice Vote state for a particular post or comment.
  struct VoteCount {
    // mapping of hash(voterAddress) => vote, where +1 == upvote, -1 == downvote, and 0 == not yet voted
    mapping(bytes32 => int8) votes;

    // accumulation of all votes for this content
    int256 total;
  }

  /// @notice Per-author vote totals for posts and comments.
  struct Karma {
    /// @notice total of all votes for posts by this author.
    int256 post;

    /// @notice total of all votes for comments by this author.
    int256 comment;
  }

  /// @dev counter for issuing post ids
  Counters.Counter private postIdCounter;
  
  /// @dev counter for issuing comment ids
  Counters.Counter private commentIdCounter;

  /// @dev maps post or comment id to vote state
  mapping(uint256 => VoteCount) private votes;

  /// @dev maps author address to vote totals
  mapping(address => Karma) private authorKarma;

  /// @dev maps post id to posts
  mapping(uint256 => Post) private posts;

  /// @dev maps comment id to comments
  mapping(uint256 => Comment) private comments;

  /// @dev maps post id to comment ids attached to post. Most recent comments are at end of array.
  mapping(uint256 => uint256[]) private postComments;

  /// @notice NewPost events are emitted when a post is created.
  event NewPost(
    uint256 indexed id,
    address indexed author
  );

  /// @notice NewComment events are emitted when a comment is created.
  event NewComment(
    uint256 indexed id,
    address indexed author,
    uint indexed postId
  );

  /// @notice 

  /**
    * @notice Create a new post.
    * @param contentCID IPFS CID of post content object.
   */
  function addPost(string memory contentCID) public {
    postIds.increment();
    uint256 id = postIds.current();
    address author = msg.sender;

    posts[id] = Post(id, author, contentCID);
    emit NewPost(id, author);
  }

  /**
    * @notice Fetch a post by id.
    * @dev Will always return a Post object, even if no post exists with the given id! 
    *      If the post does not exist, the returned Post will have empty values for all fields.
    */
  function getPost(uint256 postId) public view returns (Post memory) {
    require(posts[postId].id == postId, "No post found");
    return posts[postId];
  }

  /** 
    * @notice Adds a comment to a post.
    * @dev will revert if post does not exist.
    * @param postId the id of an existing post
    * @param contentCID IPFS CID of comment content object
    */
  function addComment(uint256 postId, string memory contentCID) public {
    require(posts[postId].id == postId, "Post does not exist");

    commentIds.increment();
    uint256 id = commentIds.current();
    address author = msg.sender;

    comments[id] = Comment(id, author, postId, contentCID);
    postComments[postId].push() = id;
    emit NewComment(id, author, postId);
  }

  /**
    * @notice Fetch a comment by id.
    * @dev Will always return a Comment struct, even if no comment exists with the given id.
    *      If no comment exists, all fields will be 
    */
  function getComment(uint256 commentId) public view returns (Comment memory) {
    require(comments[commentId].id == commentId, "No comment found");
    return comments[commentId];
  }

  function getPostComments(uint256 postId) public view returns (Comment[] memory) {
    Comment[] memory out = new Comment[](postComments[postId].length);
    for (uint i = 0; i < out.length; i++) {
      uint commentId = postComments[postId][i];
      out[i] = comments[commentId];
    }
    return out;
  }

  function getNumberOfComments(uint256 postId) public view returns (uint) {
    return postComments[postId].length;
  }

  function getPostCommentsPaged(uint256 postId, uint256 offset, uint256 limit) public view returns (Comment[] memory){
    if (offset >= postComments[postId].length) {
      Comment[] memory empty = new Comment[];
      return empty;
    }

    Comment[] memory out = new Comment[](limit);
    for (uint i = 0; i < out.length; i++) {
      if (i + offset >= postComments[postId].length) {
        break;
      }

      uint commentId = postComments[postId][i+offset];
      out[i] = comments[commentId];
    }
    return out;
  }

  function voteForPost(uint256 postId, int8 voteValue) public {
    require(posts[postId].id == postId, "Post does not exist");
    require(voteValue >= -1 && voteValue <= 1, "Invalid vote value. Must be -1, 0, or 1");

    bytes32 voterId = _voterId(msg.sender);
    int8 oldVote = votes[postId].votes[voterId];
    if (oldVote != voteValue) {
      votes[postId].votes[voterId] = voteValue;
      votes[postId].total = votes[postId].total - oldVote + voteValue;

      address author = posts[postId].author;
      if (author != msg.sender) {
        authorKarma[author].post = authorKarma[author].post - oldVote + voteValue;
      }
    }
  }

  function voteForComment(uint256 commentId, int8 voteValue) public {
    require(comments[commentId].id == commentId, "Comment does not exist");
    require(voteValue >= -1 && voteValue <= 1, "Invalid vote value. Must be -1, 0, or 1");

    bytes32 voterId = _voterId(msg.sender);
    int8 oldVote = votes[commentId].votes[voterId];
    if (oldVote != voteValue) {
      votes[commentId].votes[voterId] = voteValue;
      votes[commentId].total = votes[commentId].total - oldVote + voteValue;

      address author = comments[commentId].author;
      if (author != msg.sender) {
        authorKarma[author].comment = authorKarma[author].comment - oldVote + voteValue;
      }
    }
  }

  function getVotes(uint256 postOrCommentId) public view returns (int256) {
    return votes[postOrCommentId].total;
  }

  function getPostKarma(address author) public view returns (int256) {
    return authorKarma[author].post;
  }

  function getCommentKarma(address author) public view returns (int256) {
    return authorKarma[author].comment;
  }

  function _voterId(address voter) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(voter));
  }

}
