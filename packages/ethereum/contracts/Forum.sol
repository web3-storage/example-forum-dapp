//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/Counters.sol";

contract Forum {
  using Counters for Counters.Counter;
  Counters.Counter private ids;
  
  struct Post {
    uint256 id;
    address author;
    string contentCID;
  }

  struct Comment {
    uint256 id;
    address author;
    uint256 postId;
    string contentCID;
  }

  struct VoteCount {
    // mapping of hash(voterAddress) => vote, where +1 == upvote, -1 == downvote, and 0 == not yet voted
    mapping(bytes32 => int8) votes;

    // accumulation of all votes for this content
    int256 total;
  }

  mapping(uint256 => VoteCount) private votes;
  mapping(uint256 => Post) private posts;
  mapping(uint256 => Comment) private comments;
  mapping(uint256 => uint256[]) private postComments;

  event NewPost(
    uint256 indexed id,
    address indexed author
  );

  event NewComment(
    uint256 indexed id,
    address indexed author,
    uint indexed postId
  );

  function addPost(string memory contentCID) public {
    ids.increment();
    uint256 id = ids.current();
    address author = msg.sender;

    posts[id] = Post(id, author, contentCID);
    emit NewPost(id, author);
  }

  function getPost(uint256 postId) public view returns (Post memory) {
    return posts[postId];
  }

  function addComment(uint256 postId, string memory contentUri) public {
    require(posts[postId].id == postId, "Post does not exist");
    
    ids.increment();
    uint256 id = ids.current();
    address author = msg.sender;

    comments[id] = Comment(id, author, postId, contentUri);
    postComments[postId].push() = id;
    emit NewComment(id, author, postId);
  }

  function getComment(uint256 commentId) public view returns (Comment memory) {
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

  function voteForPost(uint256 postId, int8 voteValue) public {
    require(posts[postId].id == postId, "Post does not exist");
    require(voteValue >= -1 && voteValue <= 1, "Invalid vote value. Must be -1, 0, or 1");

    bytes32 voterId = _voterId(msg.sender);
    int8 oldVote = votes[postId].votes[voterId];
    if (oldVote != voteValue) {
      votes[postId].votes[voterId] = voteValue;
      votes[postId].total = votes[postId].total - oldVote + voteValue;
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
    }
  }

  function getVotes(uint256 postOrCommentId) public view returns (int256) {
    return votes[postOrCommentId].total;
  }

  function _voterId(address voter) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(voter));
  }

}
