const btnStart = document.getElementById("btn-start");
const home = document.getElementById("home");
const quiz = document.getElementById("quiz");

btnStart.addEventListener("click", () => {
    home.classList.add("hidden");
    quiz.classList.remove("hidden");
});

document.addEventListener("DOMContentLoaded", function () {
    var btnStart = document.getElementById("btn-start");
    var home = document.getElementById("home");
    var quiz = document.getElementById("quiz");

    btnStart.addEventListener("click", function () {
        home.classList.add("hidden");
        quiz.classList.remove("hidden");
    });

    // ===== 退出答题对话框 =====
    var btnExit = document.querySelector("#quiz .btn-danger"); // 退出答题按钮
    var modal = document.getElementById("exit-modal");
    var btnYes = document.getElementById("btn-exit-yes");
    var btnNo = document.getElementById("btn-exit-no");

    btnExit.addEventListener("click", function () {
        modal.style.display = "flex"; // 显示模态框
    });

    btnNo.addEventListener("click", function () {
        modal.style.display = "none"; // 关闭模态框
    });

    btnYes.addEventListener("click", function () {
        // 这里放退出逻辑，比如返回首页
        quiz.classList.add("hidden");
        home.classList.remove("hidden");
        modal.style.display = "none";
    });

    // 点击遮罩空白处也能关闭
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});
