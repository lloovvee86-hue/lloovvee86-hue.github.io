document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('posts-grid');
    const postsSection = document.getElementById('posts-section');
    const heroSection = document.querySelector('.hero-section');
    const postDetail = document.getElementById('post-detail');
    const postContent = document.getElementById('post-content');
    const backBtn = document.getElementById('back-btn');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');

    let allPosts = [];

    // Theme Toggle Logic
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }

    themeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Custom Minimal Markdown Parser
    function parseMarkdown(mdText) {
        if (!mdText) return '';
        
        let html = mdText
            // Escapes
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Headers
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
            // Horizontal rule
            .replace(/^---$/gm, '<hr>')
            // Unordered list items
            .replace(/^\*\s+(.*?)$/gm, '<li>$1</li>')
            .replace(/^-\s+(.*?)$/gm, '<li>$1</li>')
            // Paragraph lines (split by double newlines)
            .split('\n\n')
            .map(para => {
                para = para.strip ? para.strip() : para.trim();
                if (!para) return '';
                if (para.startsWith('<h') || para.startsWith('<hr') || para.startsWith('<li')) {
                    return para;
                }
                // Group contiguous <li> tags
                if (para.includes('<li>')) {
                    return '<ul>' + para + '</ul>';
                }
                return `<p>${para.replace(/\n/g, '<br>')}</p>`;
            })
            .join('\n');

        // Fix potential list tag issues
        html = html.replace(/<\/li>\n<li>/g, '</li><li>');
        return html;
    }

    // Render post cards
    function renderCards(posts) {
        if (posts.length === 0) {
            postsGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fa-solid fa-triangle-exclamation"></i> 등록된 퀴즈 정답 글이 없습니다.
                </div>`;
            return;
        }

        postsGrid.innerHTML = '';
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card glass-card';
            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${post.image_path || 'images/default_stereogram.png'}" alt="${post.country} 매직아이" onerror="this.src='https://placehold.co/600x400/3b82f6/ffffff?text=Magic+Eye'">
                    <span class="theme-badge ${post.theme || 'blue'}">${post.theme || 'blue'}</span>
                </div>
                <div class="card-meta">
                    <span><i class="fa-solid fa-calendar"></i> ${post.date}</span>
                    <span><i class="fa-solid fa-earth-asia"></i> ${post.country}</span>
                </div>
                <h3 class="card-title">${post.title}</h3>
                <p class="card-summary">${post.summary}</p>
                <div class="card-footer">
                    <span>정답 확인하기</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.hash = post.id;
            });
            postsGrid.appendChild(card);
        });
    }

    // Search filter
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = allPosts.filter(post => 
            post.country.toLowerCase().includes(query) || 
            post.title.toLowerCase().includes(query)
        );
        renderCards(filtered);
    });

    // Load post detail
    async function loadPostDetail(postId) {
        postsSection.classList.add('hidden');
        heroSection.classList.add('hidden');
        postDetail.classList.remove('hidden');
        
        postContent.innerHTML = `
            <div class="loading-spinner">
                <i class="fa-solid fa-circle-notch fa-spin"></i> 정답 본문을 로딩하는 중...
            </div>`;

        try {
            // Find post metadata
            const postMeta = allPosts.find(p => p.id === postId);
            
            // Fetch actual article content
            // The pipeline will save detailed post text inside posts/<post_id>.json
            const response = await fetch(`posts/${postId}.json`);
            if (!response.ok) throw new Error('Post content not found');
            
            const postData = await response.json();
            
            // Build post details view
            postContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 32px;">
                    <span style="color: var(--accent); font-weight: 700; font-size: 14px; text-transform: uppercase;">
                        <i class="fa-solid fa-earth-asia"></i> ${postMeta ? postMeta.country : '세계 퀴즈'} | <i class="fa-solid fa-calendar"></i> ${postMeta ? postMeta.date : ''}
                    </span>
                    <h1 style="font-family: var(--font-heading); font-size: 32px; font-weight: 900; margin-top: 12px; line-height: 1.3;">
                        ${postData.title}
                    </h1>
                </div>
                
                <div style="max-width: 700px; margin: 0 auto 40px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 1px solid var(--card-border);">
                    <img src="${postMeta ? postMeta.image_path : ''}" alt="${postMeta ? postMeta.country : ''} 매직아이 정답" style="width: 100%; display: block;" onerror="this.style.display='none'">
                </div>

                <div class="markdown-body">
                    ${parseMarkdown(postData.body)}
                </div>
            `;
        } catch (err) {
            console.error(err);
            postContent.innerHTML = `
                <div class="loading-spinner" style="color: #ef4444;">
                    <i class="fa-solid fa-circle-xmark"></i> 정답 본문을 불러오는 데 실패했습니다.<br>
                    정적 배포 서버가 구축 중이거나 로컬 파일 보안 정책(CORS) 때문일 수 있습니다.
                </div>`;
        }
    }

    // Go back to homepage
    backBtn.addEventListener('click', () => {
        window.location.hash = '';
    });

    // Hash Route Router
    function router() {
        const hash = decodeURIComponent(window.location.hash.substring(1));
        if (hash) {
            loadPostDetail(hash);
        } else {
            postDetail.classList.add('hidden');
            postsSection.classList.remove('hidden');
            heroSection.classList.remove('hidden');
            if (allPosts.length > 0) {
                renderCards(allPosts);
            }
        }
    }

    window.addEventListener('hashchange', router);

    // Initial Fetch of posts.json
    async function init() {
        try {
            const res = await fetch('posts.json');
            if (!res.ok) throw new Error('posts.json not found');
            allPosts = await res.json();
            
            // Sort by date descending
            allPosts.sort((a, b) => b.date.localeCompare(a.date));
            
            renderCards(allPosts);
            router(); // Run router in case user opened directly with a hash link
        } catch (err) {
            console.error(err);
            // Setup fallback mock for local preview if posts.json doesn't exist yet
            allPosts = [];
            renderCards(allPosts);
        }
    }

    init();
});
