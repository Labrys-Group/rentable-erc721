// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Escrow.sol";

contract Token is IERC20, ERC20, Ownable {
    uint8 private immutable _decimals;
    Escrow public escrow;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        Escrow _escrow
    ) ERC20(name_, symbol_) {
        require(address(_escrow) != address(0), "Cannot set contract to zero address");
        _decimals = decimals_;
        escrow = _escrow;
    }

    function mint(address account, uint256 amount) external onlyOwner {
        require(account != address(0), "Cannot mint to zero address");
        _mint(account, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function setEscrowAccount(Escrow _escrow) public onlyOwner {
        require(address(_escrow) != address(0), "Cannot set contract to zero address");
        escrow = _escrow;
    }

    function sendToEscrow(uint256 amount, uint256 tokenId) public {
        require(this.balanceOf(msg.sender) >= amount, "You do not have enough tokens");
        require(address(escrow) != address(0), "Cannot send tokens to non-zero address");
        escrow.makeProposal(tokenId);
        this.transferFrom(msg.sender, address(escrow), amount);
    }
}