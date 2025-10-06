const btnStart = document.getElementById("btn-start");
const home = document.getElementById("home");
const quiz = document.getElementById("quiz");

btnStart.addEventListener("click", () => {
    home.classList.add("hidden");
    quiz.classList.remove("hidden");
});

document.addEventListener("DOMContentLoaded", function () {
    var countdownInterval = null;

    var timerSpan = document.getElementById("timer");

    function startCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        var duration = 10000; // 10s
        var start = Date.now();

        function render() {
            var elapsed = Date.now() - start;
            var left = Math.max(0, duration - elapsed);
            var sec = (left / 1000).toFixed(1);

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

        // 先渲染一次
        render();
        countdownInterval = setInterval(render, 100);
    }

    btnStart.addEventListener("click", function () {
        home.classList.add("hidden");
        quiz.classList.remove("hidden");
        startCountdown();
    });

    // 退出答题对话框
    // 退出答题按钮
    var btnExit = document.querySelector("#quiz .btn-danger");
    var modal = document.getElementById("exit-modal");
    var btnYes = document.getElementById("btn-exit-yes");
    var btnNo = document.getElementById("btn-exit-no");

    // 显示模态框
    btnExit.addEventListener("click", function () {
        modal.style.display = "flex";
    });

    // 关闭模态框
    btnNo.addEventListener("click", function () {
        modal.style.display = "none";
    });

    btnYes.addEventListener("click", function () {
        quiz.classList.add("hidden");
        home.classList.remove("hidden");
        modal.style.display = "none";
        timerSpan.textContent = ""
    });

    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
    fetch("/shenyang_metro_quiz/data/question_bank.json")
        .then(response => response.json())
        .then(data => {
            var totalCount = data.length;
            document.getElementById("total").textContent = totalCount;

            // 取题目
            var current = data[0];

            // 设置题干
            document.getElementById("question-text").innerHTML = current.question;

            // 设置 4 个选项
            document.getElementById("option-a").innerHTML = "<span class='label'>A.</span>" + current.option_a;
            document.getElementById("option-b").innerHTML = "<span class='label'>B.</span>" + current.option_b;
            document.getElementById("option-c").innerHTML = "<span class='label'>C.</span>" + current.option_c;
            document.getElementById("option-d").innerHTML = "<span class='label'>D.</span>" + current.option_d;
        })
        .catch(err => {
            console.error("读取题库失败：", err);
        });
});
