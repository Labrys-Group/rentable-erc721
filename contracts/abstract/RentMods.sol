// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "../Rentable.sol";
import "../GameItem.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract RentMods is Ownable {
    Rentable public rentable;
    GameItem public gameItem;

    constructor(Rentable _rentable, GameItem _gameItem) {
        rentable = _rentable;
        gameItem = _gameItem;
    }

    modifier allowedUser(uint256 tokenId) {
        if(rentable.userOf(tokenId) == address(0)){
            require(msg.sender == gameItem.ownerOf(tokenId));
            _;
        } else {
            require(msg.sender == rentable.userOf(tokenId));
            _;
        }
     }
}