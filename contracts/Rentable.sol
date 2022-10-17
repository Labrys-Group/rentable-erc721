// SPDX-License-Identifier: MIT
pragma solidity 0.8.3; 

import "./interfaces/IERC_DualRoles.sol";
import "./GameItem.sol";
import "./Token.sol";

contract Rentable is IERC_DualRoles {
    Token public token;
    GameItem public gameItem;

    struct UserInfo 
    {
        address user;   // address of user role
        uint64 expires; // unix timestamp
    }

    //Map token ID to user info
    mapping (uint256  => UserInfo) internal _user;

    constructor(Token _token, GameItem _gameItem)
     {      
        token = _token;
        gameItem = _gameItem;
     }
    
    function setUser(uint256 tokenId, address user, uint64 expires) public virtual override{
        require(msg.sender == gameItem.ownerOf(tokenId), "Rentable: Only the owner can set a user");
        require(this.userOf(tokenId) == address(0), "Rentable: Token has already been rented out");
        UserInfo storage info =  _user[tokenId];
        info.user = user;
        info.expires = expires;
        emit UpdateUser(tokenId,user,expires);
    }

    //Transfers back to owner when expired
    function transferToOwner(uint256 tokenId) public {
        require(_user[tokenId].expires >= block.timestamp || msg.sender == _user[tokenId].user);
        UserInfo storage info =  _user[tokenId];
        info.user = address(0);
    }

    //Request to rent an item-- send to escrow contract
    function requestRental(uint256 tokenId) public {

    }

    /**
    * get the user expires of a token.     
    * if there is no user role of a token , it will return 0 
    */
    function userExpires(uint256 tokenId) public view virtual override returns(uint256){
        return _user[tokenId].expires;
    }
     
    /**  get the user role of a token */
    function userOf(uint256 tokenId)public view virtual override returns(address){
        if( uint256(_user[tokenId].expires) >=  block.timestamp){
            return  _user[tokenId].user; 
        }
        else{
            return address(0);
        }
    }
} 