/**
 * download.js
 * 역할: 서버(API)에서 변환된 파일 정보를 받아와 파일명과 다운로드 링크만 수정
 * (이미지 표시는 HTML에 있는 그대로 둠)
 */

window.addEventListener('DOMContentLoaded', async () => {

    // 1. HTML 요소들 가져오기
    const fileNameElement = document.getElementById("result-file-name");
    const downloadBtn = document.getElementById("download-link");
    // 이미지 태그(imgElement)는 건드리지 않음

    // 2. URL에서 id 값 가져오기 (예: download.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const dicomId = params.get('id');

    let data; // 데이터를 담을 변수

    try {
        // ============================================================
        // [옵션 A] 실제 서버 연결 코드 (백엔드 배포 후 주석 해제하세요)
        // ============================================================
        /*
        // ID가 없으면 경고
        if (!dicomId) {
             alert("잘못된 접근입니다.");
             window.location.href = "upload.html";
             return;
        }

        const response = await fetch(`/api/dicom/view/${dicomId}`);
        if (!response.ok) throw new Error("서버 통신 오류");
        data = await response.json();
        */

        // ============================================================
        // [옵션 B] 테스트용 가짜 코드 (현재 사용 중)
        // ============================================================
        
        // 로딩 흉내 (0.5초)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 가짜 데이터
        data = {
            fileName: "chest_xray_test.dcm",        
            pngPath: "janjf93-hook-1727484_1280.png" 
        };
        
        console.log("현재 테스트 데이터를 사용 중입니다:", data);


        // ============================================================
        // 3. 화면 업데이트 (이미지 소스 변경 코드는 제외함)
        // ============================================================

        // (1) 파일명 텍스트 변경
        if (data.fileName) {
            fileNameElement.textContent = data.fileName;
        }

        // (2) 다운로드 버튼 설정 (★ UX 개선 포인트: .dcm 제거 ★)
        if (data.pngPath) {
            // 버튼을 누르면 이동할 경로 (이미지 파일 경로)
            downloadBtn.href = data.pngPath; 
            
            // 파일명 정리: .dcm 또는 .dicom 확장자를 제거
            const originalName = data.fileName || 'image';
            const cleanName = originalName.replace('.dcm', '').replace('.dicom', '');
            
            // 최종 다운로드 파일명: converted_chest_xray_test.png
            downloadBtn.setAttribute("download", `converted_${cleanName}.png`);
        }

    } catch (error) {
        console.error("에러 발생:", error);
        fileNameElement.textContent = "오류 발생";
        alert("정보를 불러오는 데 실패했습니다.");
    }
});