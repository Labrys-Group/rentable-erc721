// SPDX-License-Identifier: MIT
pragma solidity 0.8.3; 

import "./interfaces/IERC_DualRoles.sol";
import "./GameItem.sol";

contract Rentable is IERC_DualRoles {
    GameItem public gameItem;
    struct UserInfo 
    {
        address user;   // address of user role
        uint64 expires; // unix timestamp
    }

    mapping (uint256  => UserInfo) internal _users;

    constructor(GameItem _gameItem)
     {      
        require(address(_gameItem) != address(0), "Cannot set game item to zero address");
        gameItem = _gameItem;
     }
    
    function setUser(uint256 tokenId, address user, uint64 expires) public virtual override{
       require(msg.sender == gameItem.ownerOf(tokenId), "Rentable: Only the owner can set a user");
        UserInfo storage info =  _users[tokenId];
        info.user = user;
        info.expires = expires;
        emit UpdateUser(tokenId,user,expires);
    }

    /**
    * get the user expires of a token.     
    * if there is no user role of a token , it will return 0 
    */
    function userExpires(uint256 tokenId) public view virtual override returns(uint256){
        return _users[tokenId].expires;
    }
     
    /**  get the user role of a token */
    function userOf(uint256 tokenId)public view virtual override returns(address){
        if( uint256(_users[tokenId].expires) >=  block.timestamp){
            return  _users[tokenId].user; 
        }
        else{
            return address(0);
        }
    }
} 