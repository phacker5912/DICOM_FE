const dropArea = document.getElementById("drop-area"); /*업로드 박스*/
const fileInput = document.getElementById("file-input");
const browseBtn = document.getElementById("browse-btn"); /*파일선택 버튼*/
const fileNameDisplay = document.getElementById("file-name");
const convertBtn = document.getElementById("convert-btn"); /*변환 버튼*/
const loadingOverlay = document.getElementById("loading-overlay");
const progressBar = document.getElementById("progress-bar"); //로딩바
const progressText = document.getElementById("progress-text"); //진행률(퍼센트)

let file;

//파일선택 창 열기
browseBtn.onclick = () => fileInput.click();

//파일선택 시
fileInput.addEventListener("change", function () {
  file = this.files[0];
  showFile();
});

//드래그 앤 드롭
dropArea.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropArea.classList.add("active");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("active");
});

dropArea.addEventListener("drop", (event) => {
  event.preventDefault();
  dropArea.classList.remove("active");
  file = event.dataTransfer.files[0]; /*드래그된 파일 가져오기*/
  showFile();
});

function showFile() {
  if (file) {
    fileNameDisplay.textContent = `선택된 파일: ${file.name}`; /*파일명*/
    convertBtn.disabled = false; /*변환버튼 활성화*/
    convertBtn.style.backgroundColor = "#4285f4";
  }
}

//변환 클릭 (진행률 표시)
convertBtn.addEventListener("click", () => {
  if (!file) return; /*파일 없으면 닫음*/

  //로딩 화면
  loadingOverlay.classList.remove("hidden"); /*hidden을 제거하여 보이게 함*/
  
  let width = 0; /*진행은 0%부터 시작*/
  
  //가짜로딩
  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
      //완료 시 다른 페이지 이동
      setTimeout(() => {
        window.location.href = "download.html"; /*이동할 페이지*/
      }, 500); 
    } else {
      width++; 
      progressBar.style.width = width + "%"; //로딩바 길이
      progressText.textContent = width + "%"; //숫자 업데이트
    }
  }, 20);
});