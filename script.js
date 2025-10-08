document.addEventListener("DOMContentLoaded", function () {
    let preCountdownTimer = null;   // 5s 准备倒计时
    let countdownInterval = null;   // 10s 正式倒计时
    let runToken = 0;               // 令牌：防止旧回调生效

    // —— 新增：数据缓存 & 等待标记 ——
    let dataCache = null;           // 题库缓存（数组）
    let pendingPopulateToken = null;// 等待“填题”的那一轮 token（5s 到点了但数据还没回来时使用）

    const btnStart = document.getElementById("btn-start");
    const home = document.getElementById("home");
    const quiz = document.getElementById("quiz");
    const timerSpan = document.getElementById("timer");

    const preHint = document.querySelector('#quiz .pre-hint');              // <p class="pre-hint">…
    const examRemain = document.getElementById('exam-remaining-time');

    const btnExit = document.querySelector("#quiz .btn-danger");
    const modal = document.getElementById("exit-modal");
    const btnYes = document.getElementById("btn-exit-yes");
    const btnNo = document.getElementById("btn-exit-no");

    function clearAllTimers() {
        if (preCountdownTimer) { clearInterval(preCountdownTimer); preCountdownTimer = null; }
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    }

    function startCountdown(currentToken) {
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

        const duration = 10000;
        const start = performance.now();

        function render() {
            if (currentToken !== runToken) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                return;
            }
            const elapsed = performance.now() - start;
            const left = Math.max(0, duration - elapsed);
            const sec = (left / 1000).toFixed(1);

            if (left > 0) {
                timerSpan.style.color = "black";
                timerSpan.textContent = "请在 " + sec + " 秒内作答";
            } else {
                timerSpan.style.color = "red";
                timerSpan.textContent = "作答超时，本题无效";
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
        }

        render();
        countdownInterval = setInterval(render, 100);
    }

    // —— 把“把第1题写进页面 + 启动10s计时”封装一下 ——
    function populateFirstQuestionAndStart(currentToken) {
        if (currentToken !== runToken) return;
        if (!dataCache || !Array.isArray(dataCache) || dataCache.length === 0) return;

        const q = dataCache[0];
        document.getElementById("question-text").textContent = q.question; // CSS 已 pre-wrap

        document.getElementById("option-a").innerHTML = "<span class='label'>A.</span> " + q.option_a;
        document.getElementById("option-b").innerHTML = "<span class='label'>B.</span> " + q.option_b;
        document.getElementById("option-c").innerHTML = "<span class='label'>C.</span> " + q.option_c;
        document.getElementById("option-d").innerHTML = "<span class='label'>D.</span> " + q.option_d;

        startCountdown(currentToken);
    }

    // —— 5 秒准备倒计时：结束后才“填题+开计时” ——
    function startPreCountdown(currentToken) {
        preHint.style.display = 'block';
        examRemain.textContent = '5.0';

        const duration = 5000;
        const startAt = performance.now();

        if (preCountdownTimer) { clearInterval(preCountdownTimer); }
        preCountdownTimer = setInterval(() => {
            if (currentToken !== runToken) {
                clearInterval(preCountdownTimer);
                preCountdownTimer = null;
                return;
            }
            const elapsed = performance.now() - startAt;
            const left = Math.max(0, duration - elapsed);
            const sec = (left / 1000).toFixed(1);
            examRemain.textContent = sec;

            if (left <= 0) {
                clearInterval(preCountdownTimer);
                preCountdownTimer = null;
                preHint.style.display = 'none';

                // 到点了：如果数据已就绪，立即填题；否则记下“等待填题”
                if (dataCache) {
                    populateFirstQuestionAndStart(currentToken);
                } else {
                    pendingPopulateToken = currentToken;
                    // 你也可以在这里把题干/选项临时显示为“加载中…”，看喜好：
                    // document.getElementById("question-text").textContent = "加载中…";
                }
            }
        }, 100);
    }

    // —— 开始答题：先切页与5秒准备，然后去拉数据，仅先填“共 x 题” ——
    btnStart.addEventListener("click", () => {
        runToken++;
        clearAllTimers();

        home.classList.add("hidden");
        quiz.classList.remove("hidden");

        timerSpan.style.color = "black";
        timerSpan.textContent = "请在 10.0 秒内作答";

        const myToken = runToken;
        startPreCountdown(myToken);

        // 拉题库：先只更新“共 x 题”，缓存数据；题干&选项等5秒结束再填
        fetch("data/question_bank.json")
            .then(r => {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
            })
            .then(data => {
                if (myToken !== runToken) return;     // 中途退出或重开
                dataCache = data;

                // 立刻更新“共 x 题”
                document.getElementById("total").textContent = dataCache.length;

                // 如果 5 秒刚好已经结束且在等数据，立刻补上题干&选项并启动 10s
                if (pendingPopulateToken === myToken) {
                    pendingPopulateToken = null;
                    populateFirstQuestionAndStart(myToken);
                }
            })
            .catch(err => {
                console.error("读取题库失败：", err);
            });
    });

    // —— 退出弹窗逻辑保持不变 ——
    btnExit.addEventListener("click", () => {
        modal.style.display = "flex";
    });
    btnNo.addEventListener("click", () => {
        modal.style.display = "none";
    });
    btnYes.addEventListener("click", () => {
        runToken++;           // 让在路上的回调失效
        clearAllTimers();
        timerSpan.textContent = "";
        pendingPopulateToken = null;   // 这一轮的“等填题”也作废

        quiz.classList.add("hidden");
        home.classList.remove("hidden");
        modal.style.display = "none";
    });
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });
});
