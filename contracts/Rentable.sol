// SPDX-License-Identifier: MIT
pragma solidity 0.8.3; 

import "./interfaces/IERC_DualRoles.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameItem.sol";
import "./Token.sol";
import "./Escrow.sol";

contract Rentable is IERC_DualRoles, Ownable {
    Token public token;
    Escrow public escrow;

    struct UserInfo 
    {
        address user;   // address of user role
        uint64 expires; // unix timestamp
    }

    //Map token ID to user info
    mapping (uint256  => UserInfo) internal _user;

    constructor(Token _token)
     {      
        token = _token;
     }

     function setEscrow(Escrow _escrow) public onlyOwner {
        escrow = _escrow;
     }
    
    function setUser(uint256 tokenId, address user, uint64 expires) public virtual override{
        require(msg.sender == address(escrow), "Rentable: You cannot set the user for this token");
        require(this.userOf(tokenId) == address(0), "Rentable: Token has already been rented out");
        UserInfo storage info =  _user[tokenId];
        info.user = user;
        info.expires = expires;
        emit UpdateUser(tokenId,user,expires);
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