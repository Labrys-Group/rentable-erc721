// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "./GameItem.sol";
import "./Token.sol";
import "./Rentable.sol";
import "hardhat/console.sol";

contract Escrow {
    Token public token;
    GameItem public gameItem;
    Rentable public rentable;

    struct UserProposal {
        uint256 proposalId;
        address user;
        uint256 amount;
        bool active;
    }

    UserProposal[] public userProposals;

    struct Proposals {
        UserProposal[] allProposals;
    }

    //Map token id to proposals
    mapping(uint256 => Proposals) tokenProposals;

    constructor(Token _token, GameItem _gameItem, Rentable _rentable) {
        token  = _token;
        gameItem = _gameItem;
        rentable = _rentable;
    }

    function makeProposal(uint256 tokenId) public payable returns(uint256){
        uint256 proposalId = userProposals.length + 1;
        UserProposal memory _newProposal = userProposals[proposalId];
        _newProposal.user = msg.sender;
        _newProposal.amount = msg.value;
        _newProposal.active = true;
        _newProposal.proposalId = proposalId;
        userProposals.push(_newProposal);
        tokenProposals[tokenId].allProposals.push(_newProposal);
        return _newProposal.proposalId;
    }

    function getProposal(uint256 tokenId, uint256 proposalId) public view returns(UserProposal memory thisProposal) {
        return(tokenProposals[tokenId].allProposals[proposalId]);
    }

    function getAllProposals(uint256 tokenId) public view returns(UserProposal[] memory all){
       return (tokenProposals[tokenId].allProposals);
    }

    function withdrawProposal(uint256 tokenId, uint256 proposalId) public {
        require(msg.sender == tokenProposals[tokenId].allProposals[proposalId].user, "You did not make this proposal");
        tokenProposals[tokenId].allProposals[proposalId].active = false;
    }

    function acceptProposal(uint256 tokenId, uint256 proposalId, uint64 expires) public {
        require(msg.sender == gameItem.ownerOf(tokenId), "You do not own this token");
        require(tokenProposals[tokenId].allProposals[proposalId].active = true, "This proposal is not active");
        require(address(this).balance >= tokenProposals[tokenId].allProposals[proposalId].amount, "Not enough tokens in contract");
        rentable.setUser(tokenId, tokenProposals[tokenId].allProposals[proposalId].user, expires);
    }
}