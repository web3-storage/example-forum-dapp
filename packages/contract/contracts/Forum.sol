//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/Counters.sol";

contract Forum {
  using Counters for Counters.Counter;
  
  enum ItemKind {
    POST,
    COMMENT
  }

  /**
    * @notice Represents a single forum post or comment. 
    */
  struct Item {
    /// @notice what kind of item (post or comment)
    ItemKind kind;

    /// @notice Unique item id, assigned at creation time.
    uint256 id;

    /// @notice Id of parent item. Posts have parentId == 0.
    uint256 parentId;

    /// @notice address of author.
    address author;

    /// @notice block number when item was submitted
    uint256 createdAtBlock;

    /// @notice ids of all child items, with oldest items at front.
    uint256[] childIds;

    /// @notice IPFS CID of item content.
    string contentCID;
  }

  /// @notice Vote state for a particular post or comment.
  struct VoteCount {
    // mapping of hash(voterAddress) => vote, where +1 == upvote, -1 == downvote, and 0 == not yet voted
    mapping(bytes32 => int8) votes;

    // accumulation of all votes for this content
    int256 total;
  }

  /// @dev counter for issuing item ids
  Counters.Counter private itemIdCounter;
  
  /// @dev maps item id to vote state
  mapping(uint256 => VoteCount) private itemVotes;

  /// @dev maps author address total post & comment vote score
  mapping(address => int256) private authorKarma;

  /// @dev maps item id to item
  mapping(uint256 => Item) private items;

  /// @notice NewItem events are emitted when a post or comment is created.
  event NewItem(
    uint256 indexed id,
    uint256 indexed parentId,
    address indexed author
  );

  /**
    * @notice Create a new post.
    * @param contentCID IPFS CID of post content object.
   */
  function addPost(string memory contentCID) public {
    itemIdCounter.increment();
    uint256 id = itemIdCounter.current();
    address author = msg.sender;

    uint256[] memory childIds;
    items[id] = Item(ItemKind.POST, id, 0, author, block.number, childIds, contentCID);
    emit NewItem(id, 0, author);
  }

  /**
    * @notice Fetch a item by id.
    * @dev reverts if no item exists with the given id.
    */
  function getItem(uint256 itemId) public view returns (Item memory) {
    require(items[itemId].id == itemId, "No item found");
    return items[itemId];
  }


  /** 
    * @notice Adds a comment to a post or another comment.
    * @dev will revert if the parent item does not exist.
    * @param parentId the id of an existing item
    * @param contentCID IPFS CID of comment content object
    */
  function addComment(uint256 parentId, string memory contentCID) public {
    require(items[parentId].id == parentId, "Parent item does not exist");

    itemIdCounter.increment();
    uint256 id = itemIdCounter.current();
    address author = msg.sender;

    items[parentId].childIds.push(id);

    uint256[] memory childIds;
    items[id] = Item(ItemKind.COMMENT, id, parentId, author, block.number, childIds, contentCID);
    emit NewItem(id, parentId, author);
  }

  function voteForItem(uint256 itemId, int8 voteValue) public {
    require(items[itemId].id == itemId, "Item does not exist");
    require(voteValue >= -1 && voteValue <= 1, "Invalid vote value. Must be -1, 0, or 1");

    bytes32 voterId = _voterId(msg.sender);
    int8 oldVote = itemVotes[itemId].votes[voterId];
    if (oldVote != voteValue) {
      itemVotes[itemId].votes[voterId] = voteValue;
      itemVotes[itemId].total = itemVotes[itemId].total - oldVote + voteValue;

      address author = items[itemId].author;
      if (author != msg.sender) {
        authorKarma[author] = authorKarma[author] - oldVote + voteValue;
      }
    }
  }

  function getItemScore(uint256 itemId) public view returns (int256) {
    return itemVotes[itemId].total;
  }

  function getAuthorKarma(address author) public view returns (int256) {
    return authorKarma[author];
  }

  function _voterId(address voter) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(voter));
  }

}
