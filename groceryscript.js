document.addEventListener("DOMContentLoaded", async function() {
    // Ensure Telegram WebApp is defined
    if (typeof window.Telegram === 'undefined' || typeof window.Telegram.WebApp === 'undefined') {
        console.error("Telegram WebApp is not defined. Make sure this script runs inside Telegram.");
        return;
    }

    const tg = window.Telegram.WebApp;
    tg.expand();
    let userId;

    // Attempt to initialize user
    try {
        userId = tg.initDataUnsafe.user.id;
        await loginUser(userId);
    } catch (error) {
        console.error("Error initializing user:", error);
        return;
    }

    // MainButton functionality
    if (tg.MainButton) {
        console.log("MainButton initialized");
        tg.MainButton.textColor = "#FFFFFF";
        tg.MainButton.color = "#2cab37";

        let item = "";
        let addButtonClickCount = 0;
        const addButtonClickTarget = 3;

        function setupButton(button, itemNumber) {
            button.addEventListener("click", function(){
                if (tg.MainButton.isVisible) {
                    tg.MainButton.hide();
                } else {
                    tg.MainButton.setText(`Ви обрали товар ${itemNumber}!`);
                    item = itemNumber;
                    tg.MainButton.show();
                }

                addButtonClickCount++;
                if (addButtonClickCount >= addButtonClickTarget) {
                    taskCompletion[1] = true; 
                    document.getElementById("task-add-clicks").classList.add("completed");
                    checkBonus();
                    updateQuestStatus(userId, { 'addClicks': true });
                }
            });
        }

        setupButton(document.getElementById("btn1"), "1");
        setupButton(document.getElementById("btn2"), "2");
        setupButton(document.getElementById("btn3"), "3");
        setupButton(document.getElementById("btn4"), "4");
        setupButton(document.getElementById("btn5"), "5");
        setupButton(document.getElementById("btn6"), "6");

        tg.onEvent("mainButtonClicked", function(){
            console.log("MainButton clicked with item:", item);
            tg.sendData(item);
        });
    } else {
        console.error("MainButton is not available. Make sure this code is running inside Telegram WebApp.");
    }

    // TON Connect UI setup
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://ohsudden.github.io/tonconnect-manifest.json',
        buttonRootId: 'connect'
    });
    tonConnectUI.uiOptions = {
        twaReturnUrl: 'https://t.me/super_grocery_store_bot'
    };

    // Swiper initialization
    var swiper = new Swiper(".mySwiper", {
        slidesPerView: 2,
        centeredSlides: true,
        spaceBetween: 20,
        grabCursor: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: false,
        },
    });

    // Quest functionality
    var taskCompletion = [false, false, false, false];
    var taskRewards = [10000000, 10000000, 10000000];

    async function transaction(dailyQuestAmount) {
        const transaction = {
            validUntil: Math.round(Date.now() / 1000) + 10,
            messages: [
                {
                    address: "0:0000000000000000000000000000000000000000000000000000000000000000",
                    amount: dailyQuestAmount
                }
            ]
        };
        try {
            await tonConnectUI.sendTransaction(transaction);
        } catch (e) {
            console.error(e);
        }
    }

    function checkBonus() {
        taskCompletion.forEach((completed, index) => {
            if (completed) {
                const taskReward = taskRewards[index];
                document.querySelector(`.swiper-slide[data-reward="${taskReward}"]`).classList.add('completed');
                transaction(taskReward);
                document.getElementById('total-reward').innerText = taskReward / Math.pow(10, 8);
            }
        });

        const atLeastOneTaskCompleted = taskCompletion.some(status => status);
        document.getElementById('bonus-message').style.display = atLeastOneTaskCompleted ? 'block' : 'none';
    }

    // Telegram WebApp ready function
    function onTelegramWebAppReady() {
        const user = tg.initDataUnsafe.user;

        if (user) {
            console.log('User found:', user);
            fetchUserBalance(user.id);
        } else {
            console.error('User not found');
            document.getElementById('balance').textContent = 'Error: User not found';
        }
    }

    async function fetchUserBalance(userId) {
        try {
            console.log(`Fetching balance for user: ${userId}`);
            const response = await fetch(`https://bug-free-space-fishstick-556p94gjjrp2p6gp-5000.app.github.dev/get_balance/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                console.error('Error from server:', data.error);
                document.getElementById('balance').textContent = 'Server Error';
                return;
            }
            document.getElementById('balance').textContent = data.balance + ' TON';
        } catch (error) {
            console.error('Error fetching balance:', error);
            document.getElementById('balance').textContent = 'Network Error';
        }
    }

    async function loginUser(userId) {
        try {
            const response = await fetch(`https://bug-free-space-fishstick-556p94gjjrp2p6gp-5000.app.github.dev/login/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                fetchUserQuestStatus(userId);
            } else {
                console.error('Error logging in:', data);
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    }

    async function fetchUserQuestStatus(userId) {
        try {
            const response = await fetch(`https://bug-free-space-fishstick-556p94gjjrp2p6gp-5000.app.github.dev/get_quest_status/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            updateQuestUI(data.status);
        } catch (error) {
            console.error('Error fetching quest status:', error);
        }
    }

    function updateQuestUI(status) {
        if (status['addClicks']) {
            document.getElementById("task-add-clicks").classList.add("completed");
        }
        if (status['connectWallet']) {
            document.getElementById("task-connect-wallet").classList.add("completed");
        }
        if (status['login']) {
            document.getElementById("task-login").classList.add("completed");
        }
        checkBonus();
    }

    async function updateQuestStatus(userId) {
        try {
            const response = await fetch(`https://bug-free-space-fishstick-556p94gjjrp2p6gp-5000.app.github.dev/update_quest_status/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.success) {
                throw new Error('Server error: update quest status failed');
            }
        } catch (error) {
            console.error('Error updating quest status:', error);
        }
    }

    onTelegramWebAppReady();
});
