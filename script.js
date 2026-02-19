import { API_endpoints } from './config.js';

const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("file-input");
const browseBtn = document.getElementById("browse-btn");
const fileNameDisplay = document.getElementById("file-name");
const convertBtn = document.getElementById("convert-btn");
const loadingOverlay = document.getElementById("loading-overlay");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const deleteBtn = document.getElementById("delete-btn");

let file;

// 파일선택 창 열기
browseBtn.onclick = () => fileInput.click();

// 파일선택 시
fileInput.addEventListener("change", function () {
  file = this.files[0];
  showFile();
});

// 드래그 앤 드롭
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
  file = event.dataTransfer.files[0];
  showFile();
});

function showFile() {
  if (file) {
    fileNameDisplay.textContent = `선택된 파일: ${file.name}`;
    convertBtn.disabled = false;
    convertBtn.style.backgroundColor = "#4285f4";
    deleteBtn.style.display = "inline-block";
  }
}

// 파일 삭제 기능
deleteBtn.onclick = () => {
  file = null;
  fileInput.value = ""; 
  fileNameDisplay.textContent = ""; 
  deleteBtn.style.display = "none"; 
  convertBtn.disabled = true; 
  convertBtn.style.backgroundColor = "#ccc"; 
};

// 변환 클릭
convertBtn.addEventListener("click", () => {
  if (!file) return;

  loadingOverlay.classList.remove("hidden");
  
  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", API_endpoints.UPLOAD, true);

  // ★ [수정 1] Ngrok 헤더 추가 (이게 없으면 업로드 실패)
  xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      let percent = Math.round((event.loaded / event.total) * 100);
      progressBar.style.width = percent + "%";
      progressText.textContent = percent + "%";
    }
  };

  xhr.onload = async () => {
    if (xhr.status === 200) {
      let response;
      try {
        response = JSON.parse(xhr.responseText);
      } catch (e) {
        console.error("JSON 파싱 실패:", xhr.responseText);
        alert("서버 응답 오류");
        loadingOverlay.classList.add("hidden");
        return;
      }

      const fileId = response.id;
      progressText.textContent = "이미지를 변환 중...";
      
      try {
        const convertResponse = await fetch(API_endpoints.CONVERT(fileId), {
          method: 'POST',
          // ★ [수정 2] 변환 요청에도 헤더 추가
          headers: {
            'ngrok-skip-browser-warning': '69420'
          }
        });

        if (convertResponse.ok) {
          setTimeout(() => {
            window.location.href = `download.html?id=${fileId}`; 
          }, 500); 
        } else {
          alert("변환 작업 실패");
          loadingOverlay.classList.add("hidden");
        }
      } catch (error) {
        console.error(error);
        alert("서버와 통신 중 오류 발생");
        loadingOverlay.classList.add("hidden");
      }
      
    } else {
      alert("서버 연결 실패 (업로드)");
      loadingOverlay.classList.add("hidden");
    }
  };

  xhr.onerror = () => {
    alert("네트워크 오류 발생");
    loadingOverlay.classList.add("hidden");
  };

  xhr.send(formData);
});