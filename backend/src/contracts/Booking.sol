// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BookingNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Booking {
        uint256 experienceId;
        address booker;
        uint256 date;
        uint256 price;
        bool isActive;
    }

    mapping(uint256 => Booking) public bookings;

    event BookingCreated(uint256 indexed tokenId, uint256 indexed experienceId, address indexed booker);

    constructor() ERC721("BookIt Experience Ticket", "BET") {}

    function createBooking(uint256 experienceId, uint256 date, uint256 price) external payable returns (uint256) {
        require(msg.value >= price, "Insufficient payment");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);

        bookings[newTokenId] = Booking({
            experienceId: experienceId,
            booker: msg.sender,
            date: date,
            price: price,
            isActive: true
        });

        emit BookingCreated(newTokenId, experienceId, msg.sender);

        return newTokenId;
    }

    function cancelBooking(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(bookings[tokenId].isActive, "Booking not active");

        bookings[tokenId].isActive = false;

        // Refund logic can be added here
        payable(msg.sender).transfer(bookings[tokenId].price);
    }

    function getBooking(uint256 tokenId) external view returns (Booking memory) {
        return bookings[tokenId];
    }
}