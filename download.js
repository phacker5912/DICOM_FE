/**
 * download.js - [FINAL HYBRID VERSION]
 * - ZIP 파일(다중 이미지)과 단일 이미지(PNG)를 자동으로 구별하여 처리합니다.
 * - 기능: 자동 타입 감지 -> (ZIP이면 해제 / 이미지면 바로 사용) -> 갤러리 렌더링
 */

import { API_endpoints } from './config.js';

window.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 download.js: 스마트 모드로 시작합니다.");

    // === DOM 요소 ===
    const fileNameElement = document.getElementById("result-file-name");
    const galleryContainer = document.getElementById("gallery-container");
    const explorerGrid = document.getElementById("explorer-grid-container");
    const statusIcon = document.getElementById("status-icon"); 
    
    // 버튼
    const mainDownloadBtn = document.getElementById("main-download-btn");
    const expDownloadBtn = document.getElementById("exp-download-btn");
    const viewAllBtn = document.getElementById("view-all-btn");
    
    const mainSelectBtn = document.getElementById("main-select-toggle-btn");
    const mainDeselectBtn = document.getElementById("main-deselect-btn");
    const expSelectBtn = document.getElementById("exp-select-toggle-btn");
    const expDeselectBtn = document.getElementById("exp-deselect-btn");

    // 모달
    const imageModal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const modalCaption = document.getElementById("modal-caption");
    const closeImageModal = document.getElementById("close-image-modal");

    const explorerModal = document.getElementById("explorer-modal");
    const closeExplorerModal = document.getElementById("close-explorer-modal");

    // === 상태 변수 ===
    let isSelectionMode = false;
    const selectedFiles = new Set();
    let imagesData = []; 
    let serverFileName = "result";
    let isSingleImage = false; // ★ 단일 이미지 여부 체크

    // 1. URL 파라미터 확인
    const params = new URLSearchParams(window.location.search);
    const dicomId = params.get('id');

    if (!dicomId) {
        alert("잘못된 접근입니다.");
        window.location.href = "upload.html";
        return;
    }

    try {
        await checkServerStatusAndLoad(dicomId);
    } catch (error) {
        console.error("Critical Error:", error);
        handleError("서버 연결 중 오류가 발생했습니다.");
    }


    // =========================================================
    // 📡 서버 통신 및 데이터 로딩 (지능형)
    // =========================================================

    async function checkServerStatusAndLoad(id) {
        // 1. 상태 조회
        const statusRes = await fetch(API_endpoints.HISTORY_DETAIL(id));
        if (!statusRes.ok) throw new Error("상태 조회 실패");
        
        const statusData = await statusRes.json();

        if (statusData.fileName) {
            serverFileName = statusData.fileName;
            fileNameElement.textContent = serverFileName;
        }

        if (statusData.status === 'SUCCESS') {
            updateLoadingMessage("파일을 분석하고 있습니다...");
            await processDownload(id);
        } else if (statusData.status === 'FAIL') {
            handleError("변환에 실패했습니다.");
        } else {
            handleProcessing();
        }
    }

    // ★ 핵심: ZIP인지 이미지인지 확인해서 처리
    async function processDownload(id) {
        try {
            // 다운로드 요청
            const res = await fetch(API_endpoints.DOWNLOAD(id));
            if (!res.ok) throw new Error("파일 다운로드 실패");
            
            // ★ 서버가 보낸 파일 형식이 뭔지 확인! (Content-Type)
            const contentType = res.headers.get("Content-Type");
            const blob = await res.blob();

            imagesData = []; // 초기화

            // [케이스 1] ZIP 파일인 경우 (대부분 이 경우)
            if (contentType && (contentType.includes("zip") || serverFileName.endsWith(".zip"))) {
                isSingleImage = false;
                await unzipAndLoad(blob);
            } 
            // [케이스 2] 그냥 이미지 파일인 경우 (단일 파일)
            else if (contentType && contentType.includes("image")) {
                isSingleImage = true;
                const url = URL.createObjectURL(blob);
                imagesData.push({
                    name: serverFileName,
                    url: url,
                    originalBlob: blob
                });
                console.log("단일 이미지로 감지되었습니다.");
            }
            // [기타] 알 수 없는 형식이지만 일단 ZIP으로 시도
            else {
                console.warn("알 수 없는 형식입니다. ZIP으로 간주합니다.");
                await unzipAndLoad(blob);
            }

            // 렌더링 시작
            if (imagesData.length === 0) {
                updateLoadingMessage("표시할 이미지가 없습니다.");
            } else {
                renderAll();
            }

        } catch (err) {
            console.error("처리 중 오류:", err);
            handleError("파일을 처리하는 데 실패했습니다.");
        }
    }

    // ZIP 압축 해제 로직
    async function unzipAndLoad(zipBlob) {
        try {
            const zip = await JSZip.loadAsync(zipBlob);
            const promises = [];
            
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && (zipEntry.name.match(/\.(png|jpe?g)$/i))) {
                    const promise = zipEntry.async('blob').then(blob => {
                        return {
                            name: zipEntry.name,
                            url: URL.createObjectURL(blob),
                            originalBlob: blob
                        };
                    });
                    promises.push(promise);
                }
            });

            const loadedImages = await Promise.all(promises);
            // 이름순 정렬
            loadedImages.sort((a, b) => a.name.localeCompare(b.name));
            imagesData = loadedImages;

        } catch (e) {
            throw new Error("ZIP 압축 해제 실패");
        }
    }


    // =========================================================
    // 🎮 이벤트 리스너
    // =========================================================

    mainSelectBtn.onclick = toggleSelectionMode;
    expSelectBtn.onclick = toggleSelectionMode;

    mainDeselectBtn.onclick = deselectAll;
    expDeselectBtn.onclick = deselectAll;

    mainDownloadBtn.onclick = handleDownloadClick;
    expDownloadBtn.onclick = handleDownloadClick;

    viewAllBtn.onclick = () => {
        explorerModal.style.display = "flex";
        document.body.style.overflow = "hidden";
    };
    
    closeExplorerModal.onclick = () => {
        explorerModal.style.display = "none";
        document.body.style.overflow = "auto";
    };

    closeImageModal.onclick = () => imageModal.style.display = "none";

    window.onclick = (e) => {
        if (e.target === imageModal) imageModal.style.display = "none";
        if (e.target === explorerModal) {
            explorerModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };


    // =========================================================
    // ⚙️ UI 렌더링
    // =========================================================

    function renderAll() {
        renderGallery(galleryContainer, imagesData);
        renderGallery(explorerGrid, imagesData);
        updateButtonsUI();
    }

    function renderGallery(container, images) {
        container.innerHTML = '';

        images.forEach(imgData => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'gallery-item';
            
            if (isSelectionMode) itemDiv.classList.add('select-mode');
            if (selectedFiles.has(imgData.name)) itemDiv.classList.add('selected');

            const checkOverlay = document.createElement('div');
            checkOverlay.className = 'check-overlay';
            if (selectedFiles.has(imgData.name)) checkOverlay.classList.add('checked');
            
            const img = document.createElement('img');
            img.src = imgData.url;
            img.className = 'gallery-thumb';
            img.title = "한번 클릭: 확대 / 더블 클릭: 다운로드";
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'gallery-item-name';
            nameSpan.textContent = imgData.name;

            // --- 클릭/더블클릭 구분 로직 ---
            let clickTimer = null;

            const handleClick = (e) => {
                e.stopPropagation();
                if (isSelectionMode) {
                    toggleFileSelection(imgData.name);
                } else {
                    if (clickTimer) {
                        clearTimeout(clickTimer);
                        clickTimer = null;
                    } else {
                        clickTimer = setTimeout(() => {
                            clickTimer = null;
                            openImagePopup(imgData.url, imgData.name);
                        }, 250);
                    }
                }
            };

            const handleDblClick = (e) => {
                e.stopPropagation();
                if (!isSelectionMode) {
                    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
                    downloadSingleFile(imgData.url, imgData.name);
                }
            };

            img.onclick = handleClick;
            img.ondblclick = handleDblClick;
            
            checkOverlay.onclick = (e) => {
                e.stopPropagation();
                toggleFileSelection(imgData.name);
            };

            // 텍스트 클릭 시 동작 없음 (선택 모드일때만 선택)
            nameSpan.onclick = (e) => {
                e.stopPropagation();
                if (isSelectionMode) toggleFileSelection(imgData.name);
            };

            itemDiv.appendChild(checkOverlay);
            itemDiv.appendChild(img);
            itemDiv.appendChild(nameSpan);
            container.appendChild(itemDiv);
        });
    }

    function toggleSelectionMode() {
        isSelectionMode = !isSelectionMode;
        renderAll();
    }

    function toggleFileSelection(fileName) {
        if (selectedFiles.has(fileName)) selectedFiles.delete(fileName);
        else selectedFiles.add(fileName);
        renderAll();
    }

    function deselectAll() {
        selectedFiles.clear();
        renderAll();
    }

    function updateButtonsUI() {
        const downloadText = isSelectionMode 
            ? `선택된 ${selectedFiles.size}개 다운로드` 
            : `⬇ 변환된 파일 다운로드 (${isSingleImage ? 'PNG' : 'ZIP'})`; // 파일 형식에 따라 텍스트 변경
        
        const selectText = isSelectionMode ? "선택 완료" : "선택하기";

        [mainDownloadBtn, expDownloadBtn].forEach(btn => {
            btn.textContent = downloadText;
            if (isSelectionMode) btn.classList.add('selected-mode');
            else btn.classList.remove('selected-mode');
            
            // 일반 모드 버튼 동작
            if (!isSelectionMode) {
                btn.onclick = (e) => {
                    // 서버 링크로 바로 이동 (가장 안정적)
                    window.location.href = API_endpoints.DOWNLOAD(dicomId);
                };
            } else {
                btn.onclick = handleDownloadClick; // 선택 다운로드 로직
            }
        });

        [mainSelectBtn, expSelectBtn].forEach(btn => {
            btn.textContent = selectText;
            if (isSelectionMode) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        [mainDeselectBtn, expDeselectBtn].forEach(btn => {
            if (isSelectionMode) btn.classList.remove('hidden');
            else btn.classList.add('hidden');
        });
    }

    // 선택된 파일 ZIP 압축 다운로드
    async function handleDownloadClick(e) {
        e.preventDefault();

        if (isSelectionMode) {
            if (selectedFiles.size === 0) return alert("선택된 파일이 없습니다.");
            
            const zip = new JSZip();
            let count = 0;
            
            imagesData.forEach(img => {
                if (selectedFiles.has(img.name)) {
                    zip.file(img.name, img.originalBlob);
                    count++;
                }
            });

            if (count > 0) {
                const content = await zip.generateAsync({type:"blob"});
                const a = document.createElement("a");
                a.href = URL.createObjectURL(content);
                // 원본 파일명 기반으로 이름 생성
                const baseName = serverFileName.replace(/\.(zip|png|dcm)$/i, "");
                a.download = `selected_${baseName}.zip`; 
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        }
    }

    function downloadSingleFile(url, name) {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function openImagePopup(url, name) {
        modalImg.src = url;
        modalCaption.textContent = name;
        imageModal.style.display = "block";
    }

    // --- 유틸리티 ---

    function updateLoadingMessage(msg) {
        const html = `<div class="loading-msg">${msg}</div>`;
        galleryContainer.innerHTML = html;
        explorerGrid.innerHTML = html;
    }

    function handleError(msg) {
        if (statusIcon) statusIcon.src = "janjf93-false-2061132_1280.png";
        const errorHtml = `<div class="loading-msg" style="color:red; font-weight:bold;">❌ ${msg}</div>`;
        galleryContainer.innerHTML = errorHtml;
        explorerGrid.innerHTML = errorHtml;
        fileNameElement.textContent = "오류 발생";
        mainDownloadBtn.style.display = "none";
    }

    function handleProcessing() {
        if (statusIcon) statusIcon.src = "loading_spinner.gif"; // 로딩 이미지 있다면
        updateLoadingMessage("서버에서 변환 작업 중입니다... 잠시만 기다려주세요.");
        mainDownloadBtn.textContent = "변환 중...";
        mainDownloadBtn.style.opacity = "0.6";
        mainDownloadBtn.style.pointerEvents = "none";
        
        // 3초 후 재시도
        setTimeout(() => checkServerStatusAndLoad(dicomId), 3000);
    }
});