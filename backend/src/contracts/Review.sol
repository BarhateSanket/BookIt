// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedReview {
    struct Review {
        address reviewer;
        uint256 experienceId;
        uint256 rating;
        string comment;
        uint256 timestamp;
    }

    mapping(uint256 => Review[]) public experienceReviews;
    mapping(address => mapping(uint256 => bool)) public hasReviewed;

    event ReviewSubmitted(uint256 indexed experienceId, address indexed reviewer, uint256 rating);

    function submitReview(uint256 experienceId, uint256 rating, string memory comment) external {
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(!hasReviewed[msg.sender][experienceId], "Already reviewed this experience");

        experienceReviews[experienceId].push(Review({
            reviewer: msg.sender,
            experienceId: experienceId,
            rating: rating,
            comment: comment,
            timestamp: block.timestamp
        }));

        hasReviewed[msg.sender][experienceId] = true;

        emit ReviewSubmitted(experienceId, msg.sender, rating);
    }

    function getReviews(uint256 experienceId) external view returns (Review[] memory) {
        return experienceReviews[experienceId];
    }

    function getAverageRating(uint256 experienceId) external view returns (uint256) {
        Review[] memory reviews = experienceReviews[experienceId];
        if (reviews.length == 0) return 0;

        uint256 total = 0;
        for (uint256 i = 0; i < reviews.length; i++) {
            total += reviews[i].rating;
        }
        return total / reviews.length;
    }
}