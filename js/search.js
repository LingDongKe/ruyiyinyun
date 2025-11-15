// 搜索结果页面功能
class SearchResultsManager {
    constructor() {
        console.log('🔍 SearchResultsManager 初始化开始');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.noResultsElement = document.getElementById('noResults');
        this.searchInfoElement = document.getElementById('searchInfo');
        this.resultsTable = document.getElementById('resultsTable');
        this.isInitialized = false;
        this.pendingSearch = null;
        
        this.init();
    }

    async init() {
        console.log('🔍 SearchResultsManager 初始化中...');
        
        // 先设置搜索表单事件
        this.setupSearchForm();
        
        // 等待数据加载完成
        await this.waitForData();
        
        this.isInitialized = true;
        console.log('✅ SearchResultsManager 初始化完成');
        
        // 检查URL参数并执行搜索
        this.checkUrlParams();
        
        // 执行等待中的搜索
        if (this.pendingSearch) {
            console.log('🔍 执行等待中的搜索:', this.pendingSearch);
            this.performSearch(this.pendingSearch);
            this.pendingSearch = null;
        }
    }

    async waitForData() {
        console.log('⏳ 等待数据加载...');
        
        if (window.app && window.app.dataLoaded) {
            console.log('✅ 数据已加载完成');
            return;
        }
        
        // 显示加载提示
        this.showLoading('数据加载中，请稍候...');
        
        return new Promise((resolve) => {
            // 监听数据加载完成事件
            const dataLoadedHandler = () => {
                console.log('✅ 收到数据加载完成事件');
                window.removeEventListener('dataLoaded', dataLoadedHandler);
                clearTimeout(timeoutId);
                this.hideLoading();
                resolve();
            };
            
            window.addEventListener('dataLoaded', dataLoadedHandler);
            
            // 设置超时
            const timeoutId = setTimeout(() => {
                console.warn('⏰ 数据加载超时');
                window.removeEventListener('dataLoaded', dataLoadedHandler);
                this.hideLoading();
                this.showError('数据加载超时，请刷新页面');
                resolve();
            }, 10000); // 10秒超时
            
            // 如果app已经存在但数据还没加载，也定期检查
            if (window.app) {
                const checkInterval = setInterval(() => {
                    if (window.app.dataLoaded) {
                        clearInterval(checkInterval);
                        dataLoadedHandler();
                    }
                }, 100);
                
                // 10秒后清理interval
                setTimeout(() => clearInterval(checkInterval), 10000);
            }
        });
    }

    setupSearchForm() {
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearchFormSubmit();
            });
            console.log('✅ 搜索表单事件监听器已设置');
        } else {
            console.error('❌ 搜索表单元素未找到');
        }
    }

    handleSearchFormSubmit() {
        const characterInput = document.getElementById('characterInput');
        const character = characterInput.value.trim();

        if (!character) {
            this.showError('请输入要搜索的汉字');
            return;
        }

        console.log('🔍 表单提交搜索:', character);
        this.performSearch(character);
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const character = urlParams.get('character');

        if (character) {
            console.log('🔍 从URL参数获取搜索词:', character);
            document.getElementById('characterInput').value = character;
            
            if (this.isInitialized) {
                this.performSearch(character);
            } else {
                console.log('⏳ 管理器未初始化，暂存搜索词:', character);
                this.pendingSearch = character;
            }
        }
    }

    performSearch(character) {
        console.log('🔍 开始执行搜索:', character);
        
        if (!this.isInitialized) {
            console.log('⏳ 管理器未初始化，暂存搜索词:', character);
            this.pendingSearch = character;
            this.showLoading('系统初始化中，请稍候...');
            return;
        }

        if (!window.app || !window.app.dataLoaded || !window.app.data) {
            console.error('❌ 数据尚未加载完成');
            this.showError('数据加载中，请稍后重试');
            return;
        }

        console.log('✅ 数据状态良好，开始搜索');
        console.log('数据条数:', Object.keys(window.app.data).length);
        
        const results = window.app.searchCharacters(character);
        console.log('🔍 搜索结果:', results);
        
        this.displayResults(character, results);
    }

    displayResults(character, results) {
        console.log('📊 显示搜索结果:', {
            搜索词: character,
            结果数量: Object.keys(results).length,
            结果内容: results
        });

        this.updateSearchInfo(character, results);

        if (Object.keys(results).length === 0) {
            console.log('❌ 未找到结果');
            this.showNoResults(character);
        } else {
            console.log('✅ 找到结果，显示表格');
            this.showResultsTable(character, results);
        }
    }

    updateSearchInfo(character, results) {
        const searchCharacter = document.getElementById('searchCharacter');
        const resultCount = document.getElementById('resultCount');

        if (searchCharacter) {
            searchCharacter.textContent = character;
        }
        if (resultCount) {
            resultCount.textContent = `${Object.keys(results).length} 个`;
        }
        if (this.searchInfoElement) {
            this.searchInfoElement.style.display = 'flex';
        }
        
        console.log('📝 更新搜索信息完成');
    }

    showNoResults(character) {
        console.log('显示无结果界面');
        
        if (this.resultsTable) {
            this.resultsTable.style.display = 'none';
        }
        if (this.noResultsElement) {
            this.noResultsElement.style.display = 'block';
            const noResultsText = document.getElementById('noResultsText');
            if (noResultsText) {
                noResultsText.textContent = `未找到"${character}"的发音数据`;
            }
        }
        if (this.searchInfoElement) {
            this.searchInfoElement.style.display = 'none';
        }
    }

    showResultsTable(character, results) {
        console.log('显示结果表格');
        
        if (this.noResultsElement) {
            this.noResultsElement.style.display = 'none';
        }
        if (this.resultsTable) {
            this.resultsTable.style.display = 'block';
        }

        this.renderResultsTable(results);
    }

    renderResultsTable(results) {
        const resultsBody = document.getElementById('resultsBody');
        if (!resultsBody) {
            console.error('❌ 结果表格体元素未找到');
            return;
        }

        console.log('📋 渲染结果表格，结果数量:', Object.keys(results).length);
        resultsBody.innerHTML = '';

        for (const [word, pronunciations] of Object.entries(results)) {
            const pronunciationsArray = Array.isArray(pronunciations) ? pronunciations : [pronunciations];
            console.log(`处理词语 "${word}":`, pronunciationsArray);

            pronunciationsArray.forEach((pron, index) => {
                const row = this.createResultRow(word, pron, index, pronunciationsArray.length);
                resultsBody.appendChild(row);
            });
        }
        
        console.log('✅ 结果表格渲染完成');
    }

    createResultRow(word, pronunciation, index, totalRows) {
        const row = document.createElement('tr');

        // 第一行显示汉字（跨行）
        if (index === 0) {
            const charCell = this.createCharacterCell(word, totalRows);
            row.appendChild(charCell);
        }

        // 音标单元格
        const phoneticCell = this.createPhoneticCell(pronunciation);
        row.appendChild(phoneticCell);

        // 注释单元格
        const notesCell = this.createNotesCell(pronunciation);
        row.appendChild(notesCell);

        return row;
    }

    createCharacterCell(word, rowspan) {
        const cell = document.createElement('td');
        cell.className = 'align-middle';
        cell.rowSpan = rowspan;
        cell.innerHTML = `<div class="fs-3 fw-bold text-dark text-center">${this.escapeHtml(word)}</div>`;
        return cell;
    }

    createPhoneticCell(pronunciation) {
        const cell = document.createElement('td');
        cell.className = 'align-middle text-center';

        if (pronunciation.phonetic) {
            cell.innerHTML = this.createPhoneticLinks(pronunciation.phonetic);
        } else if (pronunciation.pronunciation) {
            cell.innerHTML = this.createSinglePhoneticLink(pronunciation.pronunciation);
        } else {
            cell.innerHTML = '<span class="text-muted">-</span>';
        }

        return cell;
    }

    createPhoneticLinks(phoneticString) {
        const phonetics = phoneticString.split(',');
        return phonetics.map((ph, index) => {
            const phoneticClean = ph.trim();
            return `
                <span class="phonetic-clickable"
                      data-phonetic="${this.escapeHtml(phoneticClean)}"
                      onclick="playAudio('${this.escapeHtml(phoneticClean)}')">
                    [${this.escapeHtml(phoneticClean)}]
                    <small class="audio-icon">🔊</small>
                </span>
                ${index < phonetics.length - 1 ? '<br>' : ''}
            `;
        }).join('');
    }

    createSinglePhoneticLink(pronunciation) {
        const phoneticClean = pronunciation.trim();
        return `
            <span class="phonetic-clickable"
                  data-phonetic="${this.escapeHtml(phoneticClean)}"
                  onclick="playAudio('${this.escapeHtml(phoneticClean)}')">
                [${this.escapeHtml(phoneticClean)}]
                <small class="audio-icon">🔊</small>
            </span>
        `;
    }

    createNotesCell(pronunciation) {
        const cell = document.createElement('td');
        cell.className = 'align-middle text-muted text-center';
        cell.textContent = pronunciation.notes ? this.escapeHtml(pronunciation.notes) : '-';
        return cell;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showLoading(message) {
        console.log('显示加载提示:', message);
        let loadingElement = document.getElementById('loadingAlert');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loadingAlert';
            loadingElement.className = 'alert alert-info text-center';
            loadingElement.innerHTML = `
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <span id="loadingText">${message}</span>
            `;
            document.querySelector('.container').appendChild(loadingElement);
        } else {
            document.getElementById('loadingText').textContent = message;
            loadingElement.classList.remove('d-none');
        }
    }

    hideLoading() {
        console.log('隐藏加载提示');
        const loadingElement = document.getElementById('loadingAlert');
        if (loadingElement) {
            loadingElement.classList.add('d-none');
        }
    }

    showError(message) {
        console.error('显示错误:', message);
        const errorElement = document.getElementById('errorAlert');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('d-none');

            setTimeout(() => {
                errorElement.classList.add('d-none');
            }, 5000);
        } else {
            alert(message);
        }
    }
}

// 初始化搜索结果页面
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 results.html DOM 加载完成，初始化搜索管理器...');
    window.searchManager = new SearchResultsManager();
});

// 全局函数，供HTML调用
function performSearch(character) {
    console.log('🔍 全局搜索函数被调用:', character);
    if (window.searchManager) {
        window.searchManager.performSearch(character);
    } else if (window.app) {
        const results = window.app.searchCharacters(character);
        if (typeof displayResults === 'function') {
            displayResults(character, results);
        }
    } else {
        console.error('❌ 搜索管理器未初始化');
    }
}

// 兼容旧代码
function displayResults(character, results) {
    console.log('🔍 兼容性显示结果函数被调用');
    if (window.searchManager) {
        window.searchManager.displayResults(character, results);
    }
}
