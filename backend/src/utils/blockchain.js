const ethers = require('ethers');

// Assuming the contract is deployed on a testnet like Sepolia
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY');

// Replace with your deployed contract addresses
const bookingContractAddress = process.env.BOOKING_CONTRACT_ADDRESS || '0xYourBookingContractAddress';
const reviewContractAddress = process.env.REVIEW_CONTRACT_ADDRESS || '0xYourReviewContractAddress';

// ABI of the booking contract (simplified)
const bookingContractABI = [
    "function createBooking(uint256 experienceId, uint256 date, uint256 price) external payable returns (uint256)",
    "function cancelBooking(uint256 tokenId) external",
    "function getBooking(uint256 tokenId) external view returns (tuple(uint256, address, uint256, uint256, bool))",
    "event BookingCreated(uint256 indexed tokenId, uint256 indexed experienceId, address indexed booker)"
];

// ABI of the review contract
const reviewContractABI = [
    "function submitReview(uint256 experienceId, uint256 rating, string comment) external",
    "function getReviews(uint256 experienceId) external view returns (tuple(address, uint256, uint256, string, uint256)[])",
    "function getAverageRating(uint256 experienceId) external view returns (uint256)"
];

const bookingContract = new ethers.Contract(bookingContractAddress, bookingContractABI, provider);
const reviewContract = new ethers.Contract(reviewContractAddress, reviewContractABI, provider);

// Function to create a booking on blockchain
async function createBlockchainBooking(experienceId, date, price, signerPrivateKey) {
    const wallet = new ethers.Wallet(signerPrivateKey, provider);
    const contractWithSigner = bookingContract.connect(wallet);

    const tx = await contractWithSigner.createBooking(experienceId, date, price, { value: ethers.parseEther(price.toString()) });
    await tx.wait();

    // Get the tokenId from event
    const receipt = await provider.getTransactionReceipt(tx.hash);
    const event = receipt.logs.find(log => log.address === bookingContractAddress);
    // Parse event to get tokenId

    return tx.hash; // For simplicity, return tx hash
}

// Function to cancel booking
async function cancelBlockchainBooking(tokenId, signerPrivateKey) {
    const wallet = new ethers.Wallet(signerPrivateKey, provider);
    const contractWithSigner = bookingContract.connect(wallet);

    const tx = await contractWithSigner.cancelBooking(tokenId);
    await tx.wait();

    return tx.hash;
}

// Function to get booking details
async function getBlockchainBooking(tokenId) {
    const booking = await bookingContract.getBooking(tokenId);
    return {
        experienceId: booking[0].toNumber(),
        booker: booking[1],
        date: booking[2].toNumber(),
        price: booking[3].toNumber(),
        isActive: booking[4]
    };
}

// Function to submit review
async function submitBlockchainReview(experienceId, rating, comment, signerPrivateKey) {
    const wallet = new ethers.Wallet(signerPrivateKey, provider);
    const contractWithSigner = reviewContract.connect(wallet);

    const tx = await contractWithSigner.submitReview(experienceId, rating, comment);
    await tx.wait();

    return tx.hash;
}

// Function to get reviews
async function getBlockchainReviews(experienceId) {
    const reviews = await reviewContract.getReviews(experienceId);
    return reviews.map(review => ({
        reviewer: review[0],
        experienceId: review[1].toNumber(),
        rating: review[2].toNumber(),
        comment: review[3],
        timestamp: review[4].toNumber()
    }));
}

// Function to get average rating
async function getBlockchainAverageRating(experienceId) {
    const avg = await reviewContract.getAverageRating(experienceId);
    return avg.toNumber();
}

module.exports = {
    createBlockchainBooking,
    cancelBlockchainBooking,
    getBlockchainBooking,
    submitBlockchainReview,
    getBlockchainReviews,
    getBlockchainAverageRating
};