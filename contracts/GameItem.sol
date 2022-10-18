// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "./abstract/ERC4907.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract GameItem is Ownable, ERC4907 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC4907("GameItem", "ITM") {}

    function mint(address player)
        public
        returns (uint256)
    {
        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);

        _tokenIds.increment();
        return newItemId;
    }

    //Test if both user and owner can use this functionality
    function shoot(uint256 tokenId) public view canCall(tokenId) returns(string memory message){
        return "Shots fired";
    }

    function transferFrom(address from, address to, uint256 tokenId) public override unrentedOnly(from, tokenId){
        super.transferFrom(from, to, tokenId);
    }
}