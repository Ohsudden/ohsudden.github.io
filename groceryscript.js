document.addEventListener("DOMContentLoaded", function() {
    if (typeof window.Telegram === 'undefined' || typeof window.Telegram.WebApp === 'undefined') {
        console.error("Telegram WebApp is not defined. Make sure this script runs inside Telegram.");
        return;
    }

    let tg = window.Telegram.WebApp;
    tg.expand();

    const user = Telegram.WebApp.initDataUnsafe.user;

    if (user) {
        console.log('User found:', user);
        fetchUserBalance(user.id);
    } else {
        console.error('User not found');
        document.getElementById('balance').textContent = 'Error: User not found';
    }
    
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

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://ohsudden.github.io/tonconnect-manifest.json',
        buttonRootId: 'connect'
    });
    tonConnectUI.uiOptions = {
        twaReturnUrl: 'https://t.me/super_grocery_store_bot'
    };

    async function transaction(dailyQuestAmount) {
        const transaction = {
            validUntil: Math.round(Date.now() / 1000) + 10,
            messages: [
                {
                    address: "0:0000000000000000000000000000000000000000000000000000000000000000", // нульовий адрес
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

    var taskCompletion = [false, false, false, false];
    var taskRewards = [10000000, 10000000, 10000000];

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

    function checkBonus() {
        taskCompletion.forEach((completed, index) => {
            if (completed) {
                const taskReward = taskRewards[index];
                document.querySelector(`.swiper-slide[data-reward="${taskReward}"]`).classList.add('completed');
                transaction(taskReward);
                document.getElementById('total-reward').innerText = taskReward/Math.pow(10,8);
            }
        });

        const atLeastOneTaskCompleted = taskCompletion.some(status => status);
        document.getElementById('bonus-message').style.display = atLeastOneTaskCompleted ? 'block' : 'none';
    }
    
});
