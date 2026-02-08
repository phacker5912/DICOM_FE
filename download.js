/**
 * download.js
 * 역할: 서버에서 변환된 이미지 정보를 받아와 화면에 표시
 */

window.addEventListener('DOMContentLoaded', async () => {

    // 1. HTML 요소들 가져오기
    const fileNameElement = document.getElementById("result-file-name");
    const imgElement = document.querySelector(".success-img");
    const downloadBtn = document.getElementById("download-link");

    // 2. URL에서 id 값 가져오기 (예: download.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const dicomId = params.get('id');

    // ID가 없으면 경고 (테스트할 땐 주석 처리해도 됨)
    // if (!dicomId) {
    //     alert("잘못된 접근입니다.");
    //     window.location.href = "upload.html";
    //     return;
    // }

    let data; // 데이터를 담을 변수

    try {
        // ============================================================
        // [옵션 A] 실제 서버 연결 코드 (나중에 이 주석을 푸세요!)
        // ============================================================
        /*
        const response = await fetch(`/api/dicom/view/${dicomId}`);
        
        if (!response.ok) {
            throw new Error("서버 통신 오류");
        }

        // 서버에서 받은 진짜 데이터
        data = await response.json();
        */

        // ============================================================
        // [옵션 B] 프론트엔드 테스트용 가짜 코드 (지금은 이게 실행됨)
        // ============================================================
        
        // 0.5초 기다리는 척 (로딩 시뮬레이션)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 가짜 데이터 (백엔드가 줄 거라고 예상되는 모양)
        data = {
            fileName: "chest_xray_test.dcm",        // 가짜 파일명
            pngPath: "janjf93-hook-1727484_1280.png" // ★ 가지고 계신 이미지 파일명
        };
        
        console.log("현재 테스트 데이터를 사용 중입니다:", data);

        // ============================================================
        // 3. 화면 업데이트 (공통 로직)
        // ============================================================

        // (1) 파일명 바꿔주기
        if (data.fileName) {
            fileNameElement.textContent = data.fileName;
        }

        // (2) 이미지 경로 넣어주기
        if (data.pngPath) {
            imgElement.src = data.pngPath;
        }

        // (3) 다운로드 버튼 설정하기
        if (data.pngPath) {
            // 버튼을 누르면 이동할 경로
            downloadBtn.href = data.pngPath; 
            
            // 다운로드될 때 저장될 파일명 (예: converted_chest.dcm.png)
            downloadBtn.setAttribute("download", `converted_${data.fileName}.png`);
        }

    } catch (error) {
        console.error("에러 발생:", error);
        fileNameElement.textContent = "오류 발생";
        alert("이미지를 불러오는 데 실패했습니다.");
    }
});