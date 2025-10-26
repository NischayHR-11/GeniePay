// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SubscriptionPayment
 * @dev Smart contract for automated subscription payments with pause/cancel functionality
 * @notice This contract enables decentralized subscription management on blockchain
 */
contract SubscriptionPayment {
    
    // Subscription structure
    struct Subscription {
        address subscriber;
        address payee;
        uint256 amount;
        uint256 interval; // in seconds (e.g., 30 days = 2592000 seconds)
        uint256 nextPaymentDate;
        bool isActive;
        bool isPaused;
    }
    
    // State variables
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public userSubscriptions;
    uint256 public subscriptionCount;
    address public owner;
    
    // Events
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed payee,
        uint256 amount,
        uint256 interval
    );
    
    event PaymentProcessed(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed payee,
        uint256 amount,
        uint256 timestamp
    );
    
    event SubscriptionPaused(uint256 indexed subscriptionId, uint256 timestamp);
    event SubscriptionResumed(uint256 indexed subscriptionId, uint256 timestamp);
    event SubscriptionCancelled(uint256 indexed subscriptionId, uint256 timestamp);
    event FundsDeposited(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlySubscriber(uint256 _subscriptionId) {
        require(
            subscriptions[_subscriptionId].subscriber == msg.sender,
            "Only subscriber can call this function"
        );
        _;
    }
    
    modifier subscriptionExists(uint256 _subscriptionId) {
        require(_subscriptionId < subscriptionCount, "Subscription does not exist");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        subscriptionCount = 0;
    }
    
    /**
     * @dev Create a new subscription
     * @param _payee Address to receive payments
     * @param _amount Payment amount per interval
     * @param _interval Time between payments in seconds
     */
    function createSubscription(
        address _payee,
        uint256 _amount,
        uint256 _interval
    ) external payable returns (uint256) {
        require(_payee != address(0), "Invalid payee address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_interval > 0, "Interval must be greater than 0");
        require(msg.value >= _amount, "Insufficient payment for first interval");
        
        uint256 subscriptionId = subscriptionCount;
        
        subscriptions[subscriptionId] = Subscription({
            subscriber: msg.sender,
            payee: _payee,
            amount: _amount,
            interval: _interval,
            nextPaymentDate: block.timestamp + _interval,
            isActive: true,
            isPaused: false
        });
        
        userSubscriptions[msg.sender].push(subscriptionId);
        subscriptionCount++;
        
        // Process first payment
        payable(_payee).transfer(_amount);
        
        emit SubscriptionCreated(subscriptionId, msg.sender, _payee, _amount, _interval);
        emit PaymentProcessed(subscriptionId, msg.sender, _payee, _amount, block.timestamp);
        
        return subscriptionId;
    }
    
    /**
     * @dev Process subscription payment manually
     * @param _subscriptionId ID of the subscription
     */
    function paySubscription(uint256 _subscriptionId)
        external
        payable
        subscriptionExists(_subscriptionId)
        onlySubscriber(_subscriptionId)
    {
        Subscription storage sub = subscriptions[_subscriptionId];
        
        require(sub.isActive, "Subscription is not active");
        require(!sub.isPaused, "Subscription is paused");
        require(msg.value >= sub.amount, "Insufficient payment amount");
        require(block.timestamp >= sub.nextPaymentDate, "Payment not due yet");
        
        // Update next payment date
        sub.nextPaymentDate = block.timestamp + sub.interval;
        
        // Transfer payment to payee
        payable(sub.payee).transfer(sub.amount);
        
        // Refund excess payment
        if (msg.value > sub.amount) {
            payable(msg.sender).transfer(msg.value - sub.amount);
        }
        
        emit PaymentProcessed(_subscriptionId, msg.sender, sub.payee, sub.amount, block.timestamp);
    }
    
    /**
     * @dev Pause a subscription
     * @param _subscriptionId ID of the subscription to pause
     */
    function pauseSubscription(uint256 _subscriptionId)
        external
        subscriptionExists(_subscriptionId)
        onlySubscriber(_subscriptionId)
    {
        Subscription storage sub = subscriptions[_subscriptionId];
        
        require(sub.isActive, "Subscription is not active");
        require(!sub.isPaused, "Subscription is already paused");
        
        sub.isPaused = true;
        
        emit SubscriptionPaused(_subscriptionId, block.timestamp);
    }
    
    /**
     * @dev Resume a paused subscription
     * @param _subscriptionId ID of the subscription to resume
     */
    function resumeSubscription(uint256 _subscriptionId)
        external
        subscriptionExists(_subscriptionId)
        onlySubscriber(_subscriptionId)
    {
        Subscription storage sub = subscriptions[_subscriptionId];
        
        require(sub.isActive, "Subscription is not active");
        require(sub.isPaused, "Subscription is not paused");
        
        sub.isPaused = false;
        // Reset next payment date
        sub.nextPaymentDate = block.timestamp + sub.interval;
        
        emit SubscriptionResumed(_subscriptionId, block.timestamp);
    }
    
    /**
     * @dev Cancel a subscription permanently
     * @param _subscriptionId ID of the subscription to cancel
     */
    function cancelSubscription(uint256 _subscriptionId)
        external
        subscriptionExists(_subscriptionId)
        onlySubscriber(_subscriptionId)
    {
        Subscription storage sub = subscriptions[_subscriptionId];
        
        require(sub.isActive, "Subscription is already cancelled");
        
        sub.isActive = false;
        sub.isPaused = false;
        
        emit SubscriptionCancelled(_subscriptionId, block.timestamp);
    }
    
    /**
     * @dev Get subscription details
     * @param _subscriptionId ID of the subscription
     */
    function getSubscription(uint256 _subscriptionId)
        external
        view
        subscriptionExists(_subscriptionId)
        returns (
            address subscriber,
            address payee,
            uint256 amount,
            uint256 interval,
            uint256 nextPaymentDate,
            bool isActive,
            bool isPaused
        )
    {
        Subscription memory sub = subscriptions[_subscriptionId];
        return (
            sub.subscriber,
            sub.payee,
            sub.amount,
            sub.interval,
            sub.nextPaymentDate,
            sub.isActive,
            sub.isPaused
        );
    }
    
    /**
     * @dev Get all subscription IDs for a user
     * @param _user Address of the user
     */
    function getUserSubscriptions(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userSubscriptions[_user];
    }
    
    /**
     * @dev Check if payment is due for a subscription
     * @param _subscriptionId ID of the subscription
     */
    function isPaymentDue(uint256 _subscriptionId)
        external
        view
        subscriptionExists(_subscriptionId)
        returns (bool)
    {
        Subscription memory sub = subscriptions[_subscriptionId];
        return (
            sub.isActive &&
            !sub.isPaused &&
            block.timestamp >= sub.nextPaymentDate
        );
    }
    
    /**
     * @dev Deposit funds into contract
     */
    function deposit() external payable {
        require(msg.value > 0, "Must send some ether");
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw funds from contract (owner only)
     * @param _amount Amount to withdraw
     */
    function withdraw(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(_amount);
        emit FundsWithdrawn(owner, _amount);
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Fallback function to receive ether
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
