// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "./GameItem.sol";
import "./Token.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is Ownable{
    GameItem public gameItem;
    Token public token;

    struct UserProposal {
        uint256 tokenId;
        uint256 proposalId;
        address owner;
        address user;
        bool active;
    }

    //Index equals the proposal ID
    UserProposal[] public allProposals;

    //mapping from proposal id to user proposal
    mapping(uint256 => UserProposal) public proposal;

    //Better way to store data above?

    event ProposalMade(address owner, address user, uint256 tokenId, uint256 proposalId);

    constructor(GameItem _gameItem, Token _token) {
        require(address(_gameItem) != address(0) && address(_token) != address(0), "Cannot set contract to zero address");
        gameItem = _gameItem;
        token = _token;
    }

    function makeProposal(uint256 tokenId) public {
        uint256 proposalId = allProposals.length;
        UserProposal storage _newProposal = proposal[proposalId];
        _newProposal.active = true;
        address owner = gameItem.ownerOf(tokenId);
        _newProposal.owner = owner;
        _newProposal.proposalId = proposalId;
        _newProposal.user = msg.sender;
        allProposals.push(_newProposal);
        emit ProposalMade(owner,  _newProposal.user, tokenId, proposalId);
    }

    function getProposal(uint256 proposalId) public view returns(UserProposal memory thisProposal) {
        return(allProposals[proposalId]);
    }

    function withdrawProposal(uint256 proposalId) public {
        require(msg.sender == allProposals[proposalId].user, "Escrow: You did not make this proposal");
        allProposals[proposalId].active = false;
        proposal[proposalId].active = false;
    }

    function acceptProposal(uint256 proposalId, uint256 amount, uint64 expires) public {
        require(msg.sender == allProposals[proposalId].owner, "Escrow: You do not own this token");
        require(allProposals[proposalId].active == true, "Escrow: This proposal is not active");
        require(gameItem.userOf(allProposals[proposalId].tokenId) == address(0), "Escrow: This item has already been rented");
        require(token.balanceOf(allProposals[proposalId].user) >= amount, "Escrow: The user does not have enough tokens to complete this transaction.");
        token.transferFrom(allProposals[proposalId].user, allProposals[proposalId].owner, amount);
        gameItem.setUser(allProposals[proposalId].tokenId, allProposals[proposalId].user, expires);
    }

    function storeItemInEscrow(uint256 tokenId) public {
        if(gameItem.userOf(tokenId) != address(0)) {
            require(msg.sender == gameItem.userOf(tokenId), "You cannot start a gaming session with this token");
        } else {
            require(msg.sender == gameItem.ownerOf(tokenId), "You cannot start a gaming session with this token");
        }
        gameItem.transferFrom(gameItem.ownerOf(tokenId), address(this), tokenId);
    }

    function loseItem(uint256 tokenId, address winner) public {
        require(gameItem.ownerOf(tokenId) == address(this), "Cannot lose item that is not in escrow");
        gameItem.transferFrom(address(this), winner, tokenId);
    }
}