// main.js
// Global variables
let currentUser = null;
let postsPerPage = 1;
let currentPage = 0;
let currentMediaType = null;
let allPosts = [];
let displayedPosts = new Set();
let DATABASEPOSTS = []; 
let sharedPostId = null;
let isVideoMode = false;
let videoPosts = [];
let displayedVideoPosts = new Set();
let videoPage = 0;

// Store all registered users in localStorage
const USERS_KEY = 'meko-registered-users';
const CURRENT_USER_KEY = 'meko-current-user';

// DOM Elements
const elements = {
    // Auth elements
    authModal: document.getElementById('authModal'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    authTabs: document.querySelectorAll('.auth-tab'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    signupName: document.getElementById('signupName'),
    signupUsername: document.getElementById('signupUsername'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    signupConfirmPassword: document.getElementById('signupConfirmPassword'),
    usernameError: document.getElementById('usernameError'),
    createNewAccount: document.getElementById('createNewAccount'),
    loginError: document.getElementById('loginError'),
    
    // Main app elements
    appContainer: document.querySelector('.app-container'),
    postsFeed: document.getElementById('postsFeed'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    searchToggle: document.getElementById('searchToggle'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    profileModal: document.getElementById('profileModal'),
    postModal: document.getElementById('postModal'),
    closeProfileModal: document.getElementById('closeProfileModal'),
    closePostModal: document.getElementById('closePostModal'),
    searchHistory: document.getElementById('searchHistory'),
    suggestedProfiles: document.getElementById('suggestedProfiles'),
    trendingList: document.getElementById('trendingList'),
    postContent: document.getElementById('postContent'),
    mediaPreview: document.getElementById('mediaPreview'),
    imageUpload: document.getElementById('imageUpload'),
    videoUpload: document.getElementById('videoUpload'),
    linkInput: document.getElementById('linkInput'),
    postTopic: document.getElementById('postTopic'),
    postContentModal: document.getElementById('postContentModal'),
    postTopicModal: document.getElementById('postTopicModal'),
    mediaPreviewModal: document.getElementById('mediaPreviewModal'),
    submitNewPostBtn: document.getElementById('submitNewPostBtn'),
    addImageBtn: document.getElementById('addImageBtn'),
    addVideoBtn: document.getElementById('addVideoBtn'),
    addLinkBtn: document.getElementById('addLinkBtn'),
    
    // Mobile elements
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    mobileMenu: document.getElementById('mobileMenu'),
    closeMobileMenu: document.getElementById('closeMobileMenu'),
    mobileUserName: document.getElementById('mobileUserName'),
    mobileUserUsername: document.getElementById('mobileUserUsername'),
    mobileProfileLink: document.getElementById('mobileProfileLink'),
    mobileLogoutLink: document.getElementById('mobileLogoutLink'),
    
    bottomSearchBtn: document.getElementById('bottomSearchBtn'),
themeToggleBtn: document.getElementById('themeToggleBtn'),
    
    bottomProfileBtn: document.getElementById('bottomProfileBtn'),
    
    // User menu elements
    userMenu: document.getElementById('userMenu'),
    menuToggle: document.getElementById('menuToggle'),
    profileLink: document.getElementById('profileLink'),
    logoutLink: document.getElementById('logoutLink'),
    currentUserAvatar: document.getElementById('currentUserAvatar'),
    userAvatar: document.querySelector('#userAvatar img'),
    
    // Video navigation elements
    desktopVideosLink: document.getElementById('desktopVideosLink'),
    mobileVideosLink: document.getElementById('mobileVideosLink'),
    bottomreelsBtn: document.getElementById('bottomreelsBtn')
};
// ==================== THEME FUNCTIONS ====================

function setupTheme() {
    const savedTheme = localStorage.getItem('meko-theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-sun';
        }
    }
}

function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-sun';
        }
        localStorage.setItem('meko-theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        if (elements.themeIcon) {
            elements.themeIcon.className = 'fas fa-moon';
        }
        localStorage.setItem('meko-theme', 'dark');
    }
}

// ==================== MOBILE FUNCTIONS ====================

function openMobileMenu() {
    if (elements.mobileMenu) {
        elements.mobileMenu.classList.add('active');
    }
}

function closeMobileMenu() {
    if (elements.mobileMenu) {
        elements.mobileMenu.classList.remove('active');
    }
}

function toggleUserMenu() {
    if (elements.userMenu) {
        elements.userMenu.classList.toggle('active');
    }
}

// ==================== SEARCH FUNCTIONS ====================

function toggleSearchBar() {
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.classList.toggle('active');
        if (searchBar.classList.contains('active')) {
            if (elements.searchInput) elements.searchInput.focus();
        }
    }
}

function showSearchResults() {
    if (elements.searchInput && elements.searchInput.value.trim().length > 0) {
        if (elements.searchResults) elements.searchResults.style.display = 'block';
    }
}

function handleSearch() {
    const query = elements.searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
        if (elements.searchResults) {
            elements.searchResults.style.display = 'none';
        }
        return;
    }
    
    // Basic search implementation
    // You'll need to implement search logic based on your data
    console.log('Searching for:', query);
}

// ==================== POST CREATION FUNCTIONS ====================

function showPostModal() {
    if (elements.postModal) {
        elements.postModal.classList.add('active');
    }
}

function resetPostForm() {
    if (elements.postContentModal) elements.postContentModal.value = '';
    if (elements.postTopicModal) elements.postTopicModal.value = '';
    if (elements.mediaPreviewModal) elements.mediaPreviewModal.innerHTML = '';
}

// ==================== LIKE FUNCTION ====================

function handleLike(postId, button) {
    if (!currentUser || currentUser.isGuest) {
        alert('Please login to like posts!');
        return;
    }
    
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;
    
    if (!currentUser.likedPosts) currentUser.likedPosts = new Set();
    
    const postElement = button.closest('.post-card');
    const likesSpan = postElement.querySelector('.post-stats span:first-child');
    
    let currentLikes = post.likes;
    if (likesSpan) {
        const likesText = likesSpan.textContent;
        currentLikes = parseInt(likesText.replace(/[^0-9]/g, ''));
    }
    
    if (currentUser.likedPosts.has(postId)) {
        currentUser.likedPosts.delete(postId);
        currentLikes--;
        button.classList.remove('liked');
        button.innerHTML = '<i class="fas fa-heart"></i> Like';
    } else {
        currentUser.likedPosts.add(postId);
        currentLikes++;
        button.classList.add('liked');
        button.innerHTML = '<i class="fas fa-heart"></i> Liked';
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
    
    post.likes = currentLikes;
    
    if (likesSpan) {
        likesSpan.textContent = `${currentLikes.toLocaleString()} likes`;
        likesSpan.style.color = 'var(--accent)';
        setTimeout(() => {
            likesSpan.style.color = '';
        }, 300);
    }
    
    saveCurrentUser();
}

// ==================== SHARE FUNCTIONS ====================

function addShareButtonToPost(postElement, postId) {
    // Check if share button already exists
    if (postElement.querySelector('.share-btn')) return;
    
    // Find the post-actions-buttons container
    const postActions = postElement.querySelector('.post-actions-buttons');
    if (!postActions) return;
    
    // Create share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'action-btn share-btn';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
    shareBtn.dataset.postId = postId;
    
    // Add click event
    shareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        sharePost(postId);
    });
    
    // Insert before the like button
    const likeBtn = postActions.querySelector('[data-action="like"]');
    if (likeBtn) {
        postActions.insertBefore(shareBtn, likeBtn);
    } else {
        postActions.appendChild(shareBtn);
    }
}
// ==================== SHARE FUNCTIONS ====================

function sharePost(postId) {
    const post = DATABASEPOSTS.find(p => p.id === postId);
    if (!post) {
        alert('Post not found');
        return;
    }
    
    const shareUrl = generateShareUrl(postId);
    
    // Show share options modal instead of just copying
    showShareOptionsModal(postId, shareUrl, post);
}

function showShareOptionsModal(postId, shareUrl, post) {
    const modalContent = `
        <div class="share-modal-content">
            <div class="share-header">
                <h3>Share Post</h3>
                <button class="close-share-modal">&times;</button>
            </div>
            
            <div class="share-post-preview">
                <div class="preview-post">
                    <div class="preview-header">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.name)}&background=1e3a8a&color=fff" 
                             alt="${post.name}" class="preview-avatar">
                        <div class="preview-user-info">
                            <h4>${post.name}</h4>
                            <span>@${post.username}</span>
                        </div>
                    </div>
                    <div class="preview-content">
                        <p>${post.content ? (post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content) : ''}</p>
                        ${post.image || post.video || post.iframe ? 
                            '<div class="preview-media-indicator"><i class="fas fa-image"></i> Media</div>' : ''}
                    </div>
                </div>
            </div>
            
            <div class="share-options">
                <div class="share-url-container">
                    <label>Share Link:</label>
                    <div class="url-input-group">
                        <input type="text" value="${shareUrl}" readonly class="share-url-input" id="shareUrlInput">
                        <button class="btn btn-primary copy-url-btn" id="copyUrlBtn">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
                
                <div class="share-platforms">
                    <button class="platform-btn" data-platform="whatsapp">
                        <i class="fab fa-whatsapp"></i>
                        <span>WhatsApp</span>
                    </button>
                    <button class="platform-btn" data-platform="facebook">
                        <i class="fab fa-facebook"></i>
                        <span>Facebook</span>
                    </button>
                    <button class="platform-btn" data-platform="twitter">
                        <i class="fab fa-twitter"></i>
                        <span>Twitter</span>
                    </button>
                    <button class="platform-btn" data-platform="telegram">
                        <i class="fab fa-telegram"></i>
                        <span>Telegram</span>
                    </button>
                    <button class="platform-btn" data-platform="copy">
                        <i class="fas fa-copy"></i>
                        <span>Copy Link</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Create or update modal
    let shareModal = document.getElementById('sharePostModal');
    if (!shareModal) {
        shareModal = document.createElement('div');
        shareModal.id = 'sharePostModal';
        shareModal.className = 'share-modal';
        document.body.appendChild(shareModal);
    }
    
    shareModal.innerHTML = modalContent;
    shareModal.classList.add('active');
    
    // Add event listeners
    const closeBtn = shareModal.querySelector('.close-share-modal');
    const copyUrlBtn = shareModal.querySelector('.copy-url-btn');
    const platformBtns = shareModal.querySelectorAll('.platform-btn');
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        shareModal.classList.remove('active');
    });
    
    // Close when clicking outside
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.classList.remove('active');
        }
    });
    
    // Copy URL button
    copyUrlBtn.addEventListener('click', () => {
        const urlInput = document.getElementById('shareUrlInput');
        urlInput.select();
        navigator.clipboard.writeText(urlInput.value)
            .then(() => {
                copyUrlBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyUrlBtn.classList.add('success');
                setTimeout(() => {
                    copyUrlBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    copyUrlBtn.classList.remove('success');
                }, 2000);
            })
            .catch(err => {
                console.error('Copy failed:', err);
                alert('Failed to copy. Please copy manually.');
            });
    });
    
    // Platform buttons
    platformBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.dataset.platform;
            if (platform === 'copy') {
                const urlInput = document.getElementById('shareUrlInput');
                urlInput.select();
                navigator.clipboard.writeText(urlInput.value)
                    .then(() => {
                        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        btn.classList.add('success');
                        setTimeout(() => {
                            btn.innerHTML = '<i class="fab fa-copy"></i> Copy Link';
                            btn.classList.remove('success');
                        }, 2000);
                    });
            } else {
                shareToPlatform(platform, shareUrl, post);
            }
        });
    });
}

function shareToPlatform(platform, url, post) {
    const postContent = post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : '';
    const text = `Check out this post on Meko Network by @${post.username}: ${postContent}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    
    let shareUrl = '';
    
    switch(platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            break;
        case 'twitter':
            const hashtags = post.topic ? `&hashtags=${encodeURIComponent(post.topic)}` : '';
            shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}${hashtags}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
}

function generateShareUrl(postId) {
    const base = location.origin + location.pathname;
    const encoded = encodeURIComponent(`/post/orgin/${postId}/content`);
    return `${base}?share=${encoded}`;
}

// ==================== URL PARAMETER FUNCTIONS ====================
function processUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const share = urlParams.get("share");
    if (!share) return;

    const decoded = decodeURIComponent(share);
    // decoded = "/post/orgin/ABC123/content"

    const parts = decoded.split('/').filter(Boolean);
    // ["post", "orgin", "ABC123", "content"]

    const postId = parts[2]; // ✅ correct index

    console.log("Found shared post ID:", postId);

    const checkInterval = setInterval(() => {
        if (allPosts.length > 0) {
            clearInterval(checkInterval);
            showSharedPostModal(postId);

            // Clean URL
            history.replaceState(null, '', window.location.pathname);
        }
    }, 100);

    setTimeout(() => clearInterval(checkInterval), 5000);
}
function showSharedPostModal(postId) {
    const post = DATABASEPOSTS.find(p => p.id === postId);
    if (!post) {
        console.log('Post not found:', postId);
        return;
    }
    
    // Create modal for shared post
    const modalContent = `
        <div class="shared-post-modal-content">
            <div class="shared-post-header">
                <h2>Shared Post</h2>
                <button class="close-shared-post-modal">&times;</button>
            </div>
            
            <div class="shared-post-container" id="sharedPostContainer">
                <!-- Post will be inserted here -->
            </div>
            
            <div class="shared-post-actions">
                <button class="btn btn-primary" id="viewInFeedBtn">
                    <i class="fas fa-stream"></i> View in Feed
                </button>
                <button class="btn btn-secondary" id="shareThisPostBtn">
                    <i class="fas fa-share-alt"></i> Share This Post
                </button>
            </div>
        </div>
    `;
    
    // Create or update modal
    let sharedPostModal = document.getElementById('sharedPostModal');
    if (!sharedPostModal) {
        sharedPostModal = document.createElement('div');
        sharedPostModal.id = 'sharedPostModal';
        sharedPostModal.className = 'shared-post-modal';
        document.body.appendChild(sharedPostModal);
    }
    
    sharedPostModal.innerHTML = modalContent;
    
    // Add the actual post to the container
    const sharedPostContainer = document.getElementById('sharedPostContainer');
    if (sharedPostContainer) {
        const postElement = createPostElement(post, postId);
        sharedPostContainer.appendChild(postElement);
const modalVideos = sharedPostContainer.querySelectorAll("video");

modalVideos.forEach(video => {
    // Prevent double init
    if (!video.dataset.customPlayerInit) {
        video.controls = false;
        new CustomVideoPlayer(video);
        video.dataset.customPlayerInit = "true";
    }
});
    }
    
    // Show modal
    sharedPostModal.classList.add('active');
    
    // Add event listeners
    const closeBtn = sharedPostModal.querySelector('.close-shared-post-modal');
    const viewInFeedBtn = sharedPostModal.querySelector('#viewInFeedBtn');
    const shareBtn = sharedPostModal.querySelector('#shareThisPostBtn');
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        sharedPostModal.classList.remove('active');
    });
    
    // Close when clicking outside
    sharedPostModal.addEventListener('click', (e) => {
        if (e.target === sharedPostModal) {
            sharedPostModal.classList.remove('active');
        }
    });
    
    // View in feed button
    viewInFeedBtn.addEventListener('click', () => {
        sharedPostModal.classList.remove('active');
        
        // Scroll to post in feed
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            postElement.style.boxShadow = '0 0 0 3px var(--accent)';
            setTimeout(() => {
                postElement.style.boxShadow = '';
            }, 3000);
        }
    });
    
    // Share button
    shareBtn.addEventListener('click', () => {
        sharedPostModal.classList.remove('active');
        setTimeout(() => {
            sharePost(postId);
        }, 300);
    });
    
    // Auto-focus on the modal
    setTimeout(() => {
        sharedPostModal.focus();
    }, 100);
}

// ==================== CSS FOR SHARE MODALS ====================

const shareModalStyles = `
<style>
    /* Share Modal */
    .share-modal,
    .shared-post-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 2000;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }
    
    .share-modal.active,
    .shared-post-modal.active {
        display: flex;
    }
    
    .share-modal-content,
    .shared-post-modal-content {
        background: var(--bg-secondary);
        border-radius: 12px;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .shared-post-modal-content {
        max-width: 600px;
    }
    
    .share-header,
    .shared-post-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .share-header h3,
    .shared-post-header h2 {
        margin: 0;
        color: var(--text-primary);
    }
    
    .close-share-modal,
    .close-shared-post-modal {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.3s;
    }
    
    .close-share-modal:hover,
    .close-shared-post-modal:hover {
        background: var(--bg-card);
    }
    
    /* Share Post Preview */
    .share-post-preview {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border);
    }
    
    .preview-post {
        background: var(--bg-card);
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid var(--border);
    }
    
    .preview-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }
    
    .preview-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid var(--accent);
    }
    
    .preview-user-info h4 {
        margin: 0;
        font-size: 1rem;
        color: var(--text-primary);
    }
    
    .preview-user-info span {
        font-size: 0.85rem;
        color: var(--text-muted);
    }
    
    .preview-content p {
        margin: 0 0 0.5rem 0;
        color: var(--text-secondary);
        line-height: 1.4;
    }
    
    .preview-media-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--bg-primary);
        color: var(--text-muted);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
    }
    
    /* Share Options */
    .share-options {
        padding: 1.5rem;
    }
    
    .share-url-container {
        margin-bottom: 1.5rem;
    }
    
    .share-url-container label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    .url-input-group {
        display: flex;
        gap: 0.5rem;
    }
    
    .share-url-input {
        flex: 1;
        padding: 0.75rem;
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .copy-url-btn {
        white-space: nowrap;
    }
    
    .copy-url-btn.success {
        background: var(--success) !important;
        border-color: var(--success) !important;
    }
    
    /* Platform Buttons */
    .share-platforms {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
    }
    
    .platform-btn {
        padding: 1rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .platform-btn:hover {
        background: var(--accent);
        color: white;
        transform: translateY(-2px);
    }
    
    .platform-btn i {
        font-size: 1.5rem;
    }
    
    .platform-btn span {
        font-size: 0.85rem;
    }
    
    /* Shared Post Modal */
    .shared-post-container {
        padding: 1.5rem;
        max-height: 60vh;
        overflow-y: auto;
    }
    
    .shared-post-container .post-card {
        margin: 0;
        box-shadow: none;
        border: none;
        background: var(--bg-card);
    }
    
    .shared-post-actions {
        padding: 1.5rem;
        border-top: 1px solid var(--border);
        display: flex;
        gap: 1rem;
    }
    
    .shared-post-actions .btn {
        flex: 1;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .share-platforms {
            grid-template-columns: repeat(3, 1fr);
        }
        
        .shared-post-actions {
            flex-direction: column;
        }
    }
    
    @media (max-width: 480px) {
        .share-platforms {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .url-input-group {
            flex-direction: column;
        }
    }
</style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', shareModalStyles);
// ==================== CUSTOM VIDEO PLAYER FUNCTIONS ====================

class CustomVideoPlayer {
    constructor(videoElement, options = {}) {
        this.video = videoElement;
        this.container = videoElement.parentElement;
        this.options = options;
        this.isPlaying = false;
        this.isMuted = false;
        this.isFullscreen = false;
        this.volume = 1.0;
        
        this.init();
    }
    
    init() {
        // Create custom player container
        this.playerContainer = document.createElement('div');
        this.playerContainer.className = 'custom-video-player';
        
        // Wrap the video
        this.video.parentNode.insertBefore(this.playerContainer, this.video);
        this.playerContainer.appendChild(this.video);
        
        // Create controls
        this.createControls();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Set initial volume
        this.video.volume = this.volume;
    }
    
    createControls() {
        const controls = document.createElement('div');
        controls.className = 'video-controls';
        
        // Play/Pause button
        this.playBtn = document.createElement('button');
        this.playBtn.className = 'control-btn play-btn';
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        
        // Progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        
        this.progressFilled = document.createElement('div');
        this.progressFilled.className = 'progress-filled';
        this.progressBar.appendChild(this.progressFilled);
        
        // Time display
        this.timeDisplay = document.createElement('div');
        this.timeDisplay.className = 'time-display';
        this.timeDisplay.textContent = '0:00 / 0:00';
        
        // Volume control
        this.volumeControl = document.createElement('div');
        this.volumeControl.className = 'volume-control';
        
        this.volumeBtn = document.createElement('button');
        this.volumeBtn.className = 'control-btn volume-btn';
        this.volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        
        this.volumeSlider = document.createElement('div');
        this.volumeSlider.className = 'volume-slider';
        
        this.volumeLevel = document.createElement('div');
        this.volumeLevel.className = 'volume-level';
        this.volumeSlider.appendChild(this.volumeLevel);
        
        this.volumeControl.appendChild(this.volumeBtn);
        this.volumeControl.appendChild(this.volumeSlider);
        
        // Fullscreen button
        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.className = 'control-btn fullscreen-btn';
        this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        
        // Assemble controls
        controls.appendChild(this.playBtn);
        controls.appendChild(this.progressBar);
        controls.appendChild(this.timeDisplay);
        controls.appendChild(this.volumeControl);
        controls.appendChild(this.fullscreenBtn);
        
        this.playerContainer.appendChild(controls);
        
        // Add loading indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'video-loading';
        this.loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        this.loadingIndicator.style.display = 'none';
        this.playerContainer.appendChild(this.loadingIndicator);
    }
    
    setupEventListeners() {
        // Video events
        this.video.addEventListener('play', () => this.onPlay());
        this.video.addEventListener('pause', () => this.onPause());
        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.video.addEventListener('loadedmetadata', () => this.updateDuration());
        this.video.addEventListener('waiting', () => this.showLoading());
        this.video.addEventListener('playing', () => this.hideLoading());
        this.video.addEventListener('error', (e) => this.showError(e));
        
        // Control events
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('click', (e) => this.setVolume(e));
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Click on video toggles play
        this.video.addEventListener('click', () => this.togglePlay());
        
        // Keyboard controls
        this.playerContainer.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Make container focusable
        this.playerContainer.tabIndex = 0;
        
        // Show/hide controls on hover
        this.playerContainer.addEventListener('mouseenter', () => this.showControls());
        this.playerContainer.addEventListener('mouseleave', () => this.hideControls());
        
        // Touch events for mobile
        this.playerContainer.addEventListener('touchstart', () => this.showControls());
        this.playerContainer.addEventListener('touchend', () => {
            setTimeout(() => this.hideControls(), 3000);
        });
    }
    
    onPlay() {
        this.isPlaying = true;
        this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        this.hideControlsDelayed();
    }
    
    onPause() {
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    
    togglePlay() {
        if (this.video.paused) {
            this.video.play().catch(e => console.log('Play failed:', e));
        } else {
            this.video.pause();
        }
    }
    
    updateProgress() {
        const percent = (this.video.currentTime / this.video.duration) * 100;
        this.progressFilled.style.width = `${percent}%`;
        
        this.updateTimeDisplay();
    }
    
    updateDuration() {
        this.updateTimeDisplay();
    }
    
    updateTimeDisplay() {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };
        
        this.timeDisplay.textContent = 
            `${formatTime(this.video.currentTime)} / ${formatTime(this.video.duration)}`;
    }
    
    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.video.currentTime = percent * this.video.duration;
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.video.muted = this.isMuted;
        this.volumeBtn.innerHTML = this.isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    }
    
    setVolume(e) {
        const rect = this.volumeSlider.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        
        this.volume = percent;
        this.video.volume = percent;
        this.volumeLevel.style.width = `${percent * 100}%`;
        
        if (percent === 0) {
            this.isMuted = true;
            this.video.muted = true;
            this.volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (this.isMuted && percent > 0) {
            this.isMuted = false;
            this.video.muted = false;
            this.volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.playerContainer.requestFullscreen().catch(e => {
                console.log('Fullscreen failed:', e);
            });
            this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            this.isFullscreen = true;
        } else {
            document.exitFullscreen();
            this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            this.isFullscreen = false;
        }
    }
    
    handleKeydown(e) {
        switch(e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'f':
                this.toggleFullscreen();
                break;
            case 'm':
                this.toggleMute();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.video.currentTime = Math.max(0, this.video.currentTime - 5);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.video.volume = Math.min(1, this.video.volume + 0.1);
                this.updateVolumeDisplay();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.video.volume = Math.max(0, this.video.volume - 0.1);
                this.updateVolumeDisplay();
                break;
        }
    }
    
    updateVolumeDisplay() {
        this.volumeLevel.style.width = `${this.video.volume * 100}%`;
    }
    
    showLoading() {
        this.loadingIndicator.style.display = 'block';
    }
    
    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }
    
    showError(e) {
        const error = document.createElement('div');
        error.className = 'video-error';
        error.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error loading video</p>
        `;
        this.playerContainer.appendChild(error);
    }
    
    showControls() {
        const controls = this.playerContainer.querySelector('.video-controls');
        controls.style.opacity = '1';
    }
    
    hideControls() {
        if (!this.isPlaying) return;
        const controls = this.playerContainer.querySelector('.video-controls');
        controls.style.opacity = '0';
    }
    
    hideControlsDelayed() {
        setTimeout(() => this.hideControls(), 3000);
    }
    
    destroy() {
        // Clean up event listeners
        this.video.parentNode.insertBefore(this.video, this.playerContainer);
        this.playerContainer.remove();
    }
}

// Initialize custom video players
function initializeVideoPlayers() {
    document.querySelectorAll('.post-media video').forEach(video => {
        if (!video.classList.contains('custom-video-initialized')) {
            video.classList.add('custom-video-initialized');
            new CustomVideoPlayer(video);
        }
    });
}

// ==================== VIDEO SECURITY FUNCTIONS ====================

/**
 * Generate secure token for video URL hiding
 */
function generateSecureVideoToken(videoUrl, postId) {
    try {
        const payload = JSON.stringify({
            src: videoUrl,
            pid: postId,
            exp: Date.now() + (1000 * 60 * 10) // 10 min expiry
        });
        return btoa(payload.split('').reverse().join(''));
    } catch (error) {
        console.error('Error generating video token:', error);
        return null;
    }
}

/**
 * Decode secure video token
 */
function decodeSecureVideoToken(token) {
    try {
        const decoded = atob(token).split('').reverse().join('');
        const data = JSON.parse(decoded);
        if (Date.now() > data.exp) {
            console.warn('Video token expired');
            return null;
        }
        return data.src;
    } catch (error) {
        console.error('Error decoding video token:', error);
        return null;
    }
}

/**
 * Load secure video when visible - PROTECTED VERSION
 */
function loadSecureVideo(videoElement, secureToken) {
    if (videoElement.dataset.loaded) return;
    
    try {
        // Decode to get real URL
        const url = decodeSecureVideoToken(secureToken);
        
        if (url) {
            videoElement.controls = false;
            videoElement.src = url;
            videoElement.load();
            videoElement.dataset.loaded = "1";
        } else {
            videoElement.poster = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxMTEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3IgbG9hZGluZyB2aWRlbzwvdGV4dD48L3N2Zz4=';
        }
    } catch (error) {
        console.error('Error loading secure video:', error);
    }
}

/**
 * Video observer for lazy loading
 */
function setupVideoObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // For secure videos
                if (video.classList.contains('secure-video') && video.dataset.src) {
                    loadSecureVideo(video, video.dataset.src);
                }
                
                // Auto-play when visible
                if (video.paused && video.src && !video.controls) {
                    video.play().catch(e => {
                        console.log('Video auto-play blocked:', e.name);
                    });
                }
            } else {
                // Pause when not visible
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    }, { 
        threshold: 0.75,
        rootMargin: '50px'
    });
    
    return observer;
}

/**
 * Render media content with custom video player
 */
function renderMediaContent(post, postId) {
    if (post.iframe) {
        return `<div class="post-media"><iframe class="post-iframe" src="${post.iframe}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    } 
    else if (post.video) {
        const secureToken = generateSecureVideoToken(post.video, postId);
        
        if (!secureToken) {
            console.error('Failed to generate secure token for video');
            return `<div class="post-media video-error">
                <div style="padding: 2rem; text-align: center; background: var(--bg-secondary); border-radius: 0.5rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">Video loading error</p>
                </div>
            </div>`;
        }
        
        const videoId = `secure-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return `<div class="post-media">
            <video class="auto-pause-video secure-video" 
                   data-src="${secureToken}" 
                   data-video-id="${videoId}"
                   loop 
                    
                   controlsList="nodownload noplaybackrate" 
                   oncontextmenu="return false;" 
                   disablePictureInPicture 
                   style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none; pointer-events: auto;"
                   preload="metadata">
                Your browser does not support the video tag.
            </video>
            <div class="video-protection-overlay"></div>
            <div class="water-glass-overlay"></
        </div>`;
    } 
    else if (post.image) {
        return `<div class="post-media"><img src="${post.image}" alt="Post image" loading="lazy" oncontextmenu="return false;" crossorigin="anonymous"></div>`;
    }
    return '';
}

// ==================== VIDEO NAVIGATION FUNCTIONS ====================

/**
 * Extract video posts from database
 */
function extractVideoPosts() {
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) return [];
    
    return DATABASEPOSTS.filter(post => {
        return post.video || (post.iframe && post.iframe.includes('youtube.com/embed'));
    });
}

/**
 * Shuffle array without seed (true random)
 */
 
 function shuffleArrayRandomly(array) {
    const shuffled = [...array];
    const n = shuffled.length;

    for (let i = n - 1; i > 0; i--) {
        let j;
        if (window.crypto && window.crypto.getRandomValues) {
            // Generate a random number in [0, i] without modulo bias
            const range = i + 1;
            let max = 0xffffffff;
            let x;
            do {
                const randomBuffer = new Uint32Array(1);
                window.crypto.getRandomValues(randomBuffer);
                x = randomBuffer[0];
            } while (x >= max - (max % range)); // avoid bias
            j = x % range;
        } else {
            j = Math.floor(Math.random() * (i + 1));
        }
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Show only video posts
 */
 
function showVideoPosts() {
    isVideoMode = true;
    videoPosts = extractVideoPosts();
    
    // Shuffle video posts randomly
    videoPosts = shuffleArrayRandomly(videoPosts);
    
    // Assign unique IDs to video posts
    videoPosts.forEach((post, index) => {
    // Only assign videoId if you need it for DOM element reference
    post.videoId = post.id || `vid-${index}-${Date.now()}`;
});
  
    
    if (elements.postsFeed) {
        elements.postsFeed.innerHTML = '';
        videoPage = 0;
        displayedVideoPosts.clear();
        
        // Show video-specific header
        const videoHeader = document.createElement('div');
        videoHeader.className = 'video-section-header';
        videoHeader.innerHTML = `
            <div style="text-align: center; padding: 1.5rem; border-bottom: 1px solid var(--border); margin-bottom: 1rem;">
                <i class="fas fa-film" style="font-size: 2rem; color: var(--accent); margin-bottom: 0.5rem;"></i>
                <h2 style="margin-bottom: 0.5rem; color: var(--text-primary);">Video Posts</h2>
                <p style="color: var(--text-secondary);">Post With Videos Only
                Activated</p>
                ${videoPosts.length === 0 ? 
                    '<p style="color: var(--text-muted); margin-top: 0.5rem;">No video posts found</p>' : 
                    ''
                }
            </div>
        `;
        elements.postsFeed.appendChild(videoHeader);
        
        // Load initial video posts
        loadVideoPosts();
    }
    
    // Update navigation active states
    updateVideoNavState(true);
}

/**
 * Load more video posts
 */
function loadVideoPosts() {
    if (!elements.postsFeed || videoPosts.length === 0) return;
    
    const startIndex = videoPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    
    // Filter out already displayed posts
    const availablePosts = videoPosts.filter(post => !displayedVideoPosts.has(post.videoId));
    
    if (availablePosts.length === 0) {
        if (elements.loadMoreBtn) {
            elements.loadMoreBtn.textContent = 'No more videos';
            elements.loadMoreBtn.disabled = true;
        }
        return;
    }
    
    const postsToShow = availablePosts.slice(startIndex, endIndex);
    
    postsToShow.forEach(post => {
        const postElement = createPostElement(post, post.videoId);
        elements.postsFeed.appendChild(postElement);
        displayedVideoPosts.add(post.videoId);
        
        // Initialize custom video player for this post
        setTimeout(() => {
            const video = postElement.querySelector('video');
            if (video) {
                new CustomVideoPlayer(video);
            }
        }, 100);
    });
    
    videoPage++;
    
    if (elements.loadMoreBtn) {
        const remainingVideos = videoPosts.length - displayedVideoPosts.size;
        elements.loadMoreBtn.disabled = remainingVideos === 0;
        elements.loadMoreBtn.textContent = remainingVideos === 0 ? 
            'No more videos' : 
            `Load More Videos`;
    }
}

/**
 * Show all posts (normal mode)
 */
function showAllPosts() {
    isVideoMode = false;
    
    if (elements.postsFeed) {
        elements.postsFeed.innerHTML = '';
        currentPage = 0;
        displayedPosts.clear();
        loadPosts();
    }
    
    // Update navigation active states
    updateVideoNavState(false);
}

/**
 * Update navigation states
 */
function updateVideoNavState(isVideoActive) {
    // Desktop nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active', 'video-active');
    });
    
    if (isVideoActive) {
        if (elements.desktopVideosLink) {
            elements.desktopVideosLink.classList.add('video-active');
        }
    } else {
        if (elements.desktopHomeLink) {
            elements.desktopHomeLink.classList.add('active');
        }
    }
    
    // Mobile nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active', 'video-active');
    });
    
    if (isVideoActive) {
        if (elements.mobileVideosLink) {
            elements.mobileVideosLink.classList.add('video-active');
        }
    } else {
        if (elements.mobileHomeLink) {
            elements.mobileHomeLink.classList.add('active');
        }
    }
    
    // Bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active', 'video-active');
    });
    
    if (isVideoActive) {
        if (elements.bottomreelsBtn) {
            elements.bottomreelsBtn.classList.add('video-active');
        }
    } else {
        if (document.getElementById('bottomHomeBtn')) {
            document.getElementById('bottomHomeBtn').classList.add('active');
        }
    }
}

/**
 * Handle video navigation click
 */
function handleVideoNavigation() {
    if (isVideoMode) {
        showAllPosts();
    } else {
        showVideoPosts();
    }
}

// ==================== OBSERVER INITIALIZATION ====================

// Initialize video observer globally
let videoObserver = null;

function initializeVideoObserver() {
    if (!videoObserver) {
        videoObserver = setupVideoObserver();
    }
    return videoObserver;
}

// ==================== AUTH FUNCTIONS ====================

function showAuthModal() {
    if (elements.authModal) {
        elements.authModal.classList.add('active');
    }
    if (elements.appContainer) {
        elements.appContainer.classList.add('hidden');
    }
}

function hideAuthModal() {
    if (elements.authModal) {
        elements.authModal.classList.remove('active');
    }
    if (elements.appContainer) {
        elements.appContainer.classList.remove('hidden');
    }
}

function getRegisteredUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
}

function saveUser(username, userData) {
    const users = getRegisteredUsers();
    users[username] = userData;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function isUsernameTaken(username) {
    const users = getRegisteredUsers();
    
    if (users[username]) {
        return true;
    }
    
    if (DATABASEPOSTS && DATABASEPOSTS.length > 0) {
        return DATABASEPOSTS.some(post => post.username === username);
    }
    
    return false;
}

function saveCurrentUser() {
    if (currentUser && !currentUser.isGuest) {
        const userToSave = {
            ...currentUser,
            likedPosts: currentUser.likedPosts ? Array.from(currentUser.likedPosts) : [],
            followedTopics: currentUser.followedTopics ? Array.from(currentUser.followedTopics) : []
        };
        
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToSave));
        
        const users = getRegisteredUsers();
        if (users[currentUser.username]) {
            users[currentUser.username] = {
                ...users[currentUser.username],
                likedPosts: userToSave.likedPosts,
                searchHistory: userToSave.searchHistory,
                followedTopics: userToSave.followedTopics
            };
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
    }
}

function checkAuth() {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            
            currentUser = {
                ...parsedUser,
                likedPosts: new Set(parsedUser.likedPosts || []),
                followedTopics: new Set(parsedUser.followedTopics || []),
                isGuest: false
            };
            
            console.log('User automatically logged in:', currentUser.username);
            
            // Only initialize posts if we have data
            if (DATABASEPOSTS && DATABASEPOSTS.length > 0) {
                initializePosts();
                loadPosts();
                loadTrendingTopics();
                loadSuggestedProfiles();
            }
            
            hideAuthModal();
            updateUserUI();
            loadSearchHistory();
            
            return true;
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }
    
    showAuthModal();
    
    currentUser = {
        name: "Guest",
        username: "guest",
        email: "",
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: true
    };
    
    updateUserUI();
    return false;
}

function updateUserUI() {
    if (!currentUser) return;
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=1e3a8a&color=fff&bold=true`;
    
    if (elements.currentUserAvatar) {
        elements.currentUserAvatar.src = avatarUrl;
    }
    
    if (elements.userAvatar) {
        elements.userAvatar.src = avatarUrl;
    }
    
    if (elements.mobileUserName) {
        elements.mobileUserName.textContent = currentUser.name;
    }
    
    if (elements.mobileUserUsername) {
        elements.mobileUserUsername.textContent = `@${currentUser.username}`;
    }
    
    const mobileAvatar = elements.mobileMenu?.querySelector('.user-avatar img');
    if (mobileAvatar) mobileAvatar.src = avatarUrl;
}

function switchAuthTab(e) {
    const tab = e.target;
    const tabName = tab.dataset.tab;
    
    elements.authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tabName}Form`).classList.add('active');
    
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    if (elements.loginError) elements.loginError.style.display = 'none';
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = elements.loginUsername.value.trim().toLowerCase();
    const password = elements.loginPassword.value.trim();
    
    if (elements.loginError) {
        elements.loginError.style.display = 'none';
        elements.loginError.textContent = '';
    }
    
    if (!username || !password) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Please fill in all fields';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    const users = getRegisteredUsers();
    
    if (!users[username]) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Account not found. Please sign up first.';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    if (users[username].password !== password) {
        if (elements.loginError) {
            elements.loginError.textContent = 'Wrong password. Please try again.';
            elements.loginError.style.display = 'block';
        }
        return;
    }
    
    const userData = users[username];
    const likedPosts = new Set(userData.likedPosts || []);
    const followedTopics = new Set(userData.followedTopics || []);
    
    currentUser = {
        name: userData.name,
        username: username,
        email: userData.email,
        likedPosts: likedPosts,
        searchHistory: userData.searchHistory || [],
        followedTopics: followedTopics,
        isGuest: false
    };
    
    saveCurrentUser();
    
    saveUser(username, {
        ...userData,
        likedPosts: Array.from(likedPosts),
        searchHistory: currentUser.searchHistory,
        followedTopics: Array.from(followedTopics)
    });
    
    if (DATABASEPOSTS && DATABASEPOSTS.length > 0) {
        initializePosts();
        loadPosts();
        loadTrendingTopics();
        loadSuggestedProfiles();
    }
    
    hideAuthModal();
    updateUserUI();
    loadSearchHistory();
    
    if (elements.loginForm) elements.loginForm.reset();
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = elements.signupName.value.trim();
    const username = elements.signupUsername.value.trim().toLowerCase();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value.trim();
    const confirmPassword = elements.signupConfirmPassword.value.trim();
    
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    
    if (!name || !username || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    if (isUsernameTaken(username)) {
        if (elements.usernameError) {
            elements.usernameError.textContent = 'This username is already taken.';
            elements.usernameError.style.display = 'block';
        }
        return;
    }
    
    const userData = {
        name: name,
        email: email,
        password: password,
        likedPosts: [],
        searchHistory: [],
        followedTopics: [],
        createdAt: new Date().toISOString()
    };
    
    saveUser(username, userData);
    
    currentUser = {
        name: name,
        username: username,
        email: email,
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: false
    };
    
    saveCurrentUser();
    
    if (DATABASEPOSTS && DATABASEPOSTS.length > 0) {
        initializePosts();
        loadPosts();
        loadTrendingTopics();
        loadSuggestedProfiles();
    }
    
    hideAuthModal();
    updateUserUI();
    
    if (elements.signupForm) elements.signupForm.reset();
    
    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
    if (loginTab) loginTab.click();
}

function handleLogout(e) {
    if (e) e.preventDefault();
    
    localStorage.removeItem(CURRENT_USER_KEY);
    
    showAuthModal();
    
    if (elements.loginForm) elements.loginForm.reset();
    if (elements.signupForm) elements.signupForm.reset();
    
    if (elements.usernameError) elements.usernameError.style.display = 'none';
    if (elements.loginError) elements.loginError.style.display = 'none';
    
    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    if (elements.postsFeed) elements.postsFeed.innerHTML = '';
    displayedPosts.clear();
    currentPage = 0;
    allPosts = [];
    isVideoMode = false;
    videoPosts = [];
    displayedVideoPosts.clear();
    videoPage = 0;
    
    currentUser = {
        name: "Guest",
        username: "guest",
        email: "",
        likedPosts: new Set(),
        searchHistory: [],
        followedTopics: new Set(),
        isGuest: true
    };
    
    updateUserUI();
}

// ==================== POST FUNCTIONS ====================

function initializePosts() {
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) {
        console.log('No posts data available for initialization');
        return;
    }
    
    console.log(`Initializing ${DATABASEPOSTS.length} posts`);
    
    allPosts = [...DATABASEPOSTS];
    
    allPosts.forEach((post, index) => {
        const recoNumber = DATABASEPOSTS.length - index;
        post.id = `meko-${post.username.toLowerCase()}-reco${recoNumber}`;
        post.recoNumber = recoNumber;
    });
    
    allPosts = allPosts.reverse();
    
    console.log(`Assigned IDs to ${allPosts.length} posts`);
    
    
    allPosts = shuffleArrayRandomly(allPosts);
    
    
}

// 1. Create the Observer
const scrollObserver = new IntersectionObserver((entries) => {
    // entries[0] is the element we are watching
    if (entries[0].isIntersecting) {
        console.log("Bottom reached! Loading more...");
        loadPosts();
    }
}, {
    rootMargin: '200px', // Start loading 200px before the user reaches the bottom
    threshold: 0.1       // Trigger when 10% of the target is visible
});

// 2. Tell it what to watch
// We use your existing loadMoreBtn as the "anchor"
if (elements.loadMoreBtn) {
    scrollObserver.observe(elements.loadMoreBtn);
}

function loadPosts() {
    if (!elements.postsFeed) return;
    
    if (allPosts.length === 0) {
        console.log('No posts available to load');
        return;
    }
    
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    
    const postsToShow = allPosts
        .filter(post => !displayedPosts.has(post.id))
        .slice(startIndex, endIndex);
    
    console.log(`Loading ${postsToShow.length} posts, page ${currentPage + 1}`);
    
    if (postsToShow.length === 0) {
        if (elements.loadMoreBtn) {
            elements.loadMoreBtn.textContent = 'No more posts';
            elements.loadMoreBtn.disabled = true;
        }
        return;
    }
    
    postsToShow.forEach(post => {
        const postElement = createPostElement(post, post.id);
        elements.postsFeed.appendChild(postElement);
        displayedPosts.add(post.id);
        
        addShareButtonToPost(postElement, post.id);
        
        // Initialize custom video player if this is a video post
        if (post.video || (post.iframe && post.iframe.includes('youtube.com/embed'))) {
            setTimeout(() => {
                const video = postElement.querySelector('video');
                if (video) {
                    new CustomVideoPlayer(video);
                }
            }, 100);
        }
    });
    
    currentPage++;
    
    if (elements.loadMoreBtn) {
        const remainingPosts = allPosts.length - displayedPosts.size;
        elements.loadMoreBtn.disabled = remainingPosts === 0;
        elements.loadMoreBtn.textContent = remainingPosts === 0 ? 'No more posts' : `Reach me to Load More`;
    }
}

function loadMorePosts() {
    if (isVideoMode) {
        loadVideoPosts();
    } else {
        loadPosts();
    }
}

function createPostElement(post, postId) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.dataset.postId = postId;
    postElement.dataset.topic = post.topic || '';
    
  // FIXED AD DETECTION LOGIC
const isApiAd = post.iframe && post.iframe === "ad_service-api:290Ae028e028a028_920397Ae828";
const isAdTopic = post.topic && (
    post.topic.toLowerCase() === 'ad_service-api:290ae028e028a028_920397ae828' || // exact match (lowercase)
    post.topic === 'ad_service-api:290Ae028e028a028_920397Ae828' // exact match (original case)
);
const isSponsoredName = post.name && (
    post.name.toLowerCase() === 'ad_service-api:290ae028e028a028_920397ae828' || // exact match (lowercase)
    post.name === 'ad_service-api:290Ae028e028a028_920397Ae828' // exact match (original case)
);
const isCreatorAd = post.topic && (
    post.topic.toLowerCase() === 'ad_service-api:290ae028e028a028_920397ae828_creator' || // creator ad
    post.topic === 'ad_service-api:290Ae028e028a028_920397Ae828_creator' // creator ad original case
);

let adType = null;
if (isApiAd) {
    adType = 'API_AD';
} else if (isSponsoredName) {
    adType = 'SPONSORED_AD';
} else if (isCreatorAd) {
    adType = 'CREATOR_AD';
} else if (isAdTopic) {
    adType = 'TOPIC_AD';
}

const isAnyAd = adType !== null;
    const isVideoPost = post.video || (post.iframe && post.iframe.includes('youtube.com/embed'));
    
    const postDate = parseCustomDate(post.datePost);
    const formattedDate = formatDateToCustom(postDate);
    
    const userPosts = DATABASEPOSTS.filter(p => p.username === post.username);
    const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
    
    const firstPost = userPosts[userPosts.length - 1];
    const joinedDate = firstPost
        ? formatJoinedDate(parseCustomDate(firstPost.datePost))
        : 'Recently';
    
    let mentionedUsers = [];
    let processedContent = post.content || '';
    
    if (post.content) {
        const mentionRegex = /@(\w+)/g;
        let match;
        
        while ((match = mentionRegex.exec(post.content)) !== null) {
            mentionedUsers.push(match[1]);
        }
        
        processedContent = post.content.replace(
            /@(\w+)/g,
            '<span class="mention" data-username="$1">@$1</span>'
        );
    }
    
    const mentionsCurrentUser =
        currentUser &&
        !currentUser.isGuest &&
        mentionedUsers.includes(currentUser.username);
    
    let adLabel = '';
    let adClass = '';
    let userDisplayName = post.name;
    let userDisplayUsername = '@' + post.username;
    
    switch(adType) {
        case 'API_AD':
            adLabel = 'Sponsored • Ad';
            adClass = 'ad-api';
            userDisplayName = 'Sponsored';
            userDisplayUsername = 'Advertisement';
            break;
        case 'SPONSORED_AD':
            adLabel = 'Sponsored';
            adClass = 'ad-sponsored';
            userDisplayName = 'Sponsored';
            userDisplayUsername = '@' + post.username;
            break;
        case 'CREATOR_AD':
            adLabel = 'Creator Ad';
            adClass = 'ad-creator';
            break;
        case 'TOPIC_AD':
            adLabel = 'Promoted';
            adClass = 'ad-topic';
            break;
    }
    
    const renderMediaForThisPost = (post) => {
        if (adType === 'API_AD') {
            return `<div id="ad-${postId}" class="ad-script-container"></div>`;
        }
        
        if (post.video) {
            const secureToken = generateSecureVideoToken(post.video, postId);
            
            if (!secureToken) {
                return `<div class="post-media video-error">
                    <div style="padding: 2rem; text-align: center; background: var(--bg-secondary); border-radius: 0.5rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger); margin-bottom: 1rem;"></i>
                        <p style="color: var(--text-secondary);">Video loading error</p>
                    </div>
                </div>`;
            }
            
            const videoId = `secure-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            return `<div class="post-media">
                <video class="auto-pause-video secure-video" 
                       data-src="${secureToken}" 
                       data-video-id="${videoId}"
                       loop 
                       controls 
                       controlsList="nodownload noplaybackrate" 
                       oncontextmenu="return false;" 
                       disablePictureInPicture 
                       style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none; pointer-events: auto;"
                       preload="metadata">
                    Your browser does not support the video tag.
                </video>
                <div class="video-protection-overlay"></div>
            </div>`;
        } 
        else if (post.iframe) {
            return `<div class="post-media"><iframe class="post-iframe" src="${post.iframe}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        } 
        else if (post.image) {
            return `<div class="post-media"><img src="${post.image}" alt="Post image" loading="lazy" oncontextmenu="return false;" crossorigin="anonymous"></div>`;
        }
        return '';
    };
    
    postElement.innerHTML = `  
        <div class="post-header ${adClass}">  
            <div class="post-user" ${!isAnyAd ? `data-username="${post.username}"` : ''}>  
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=${isAnyAd ? '4a5568' : '1e3a8a'}&color=fff">  
                <div class="user-info">  
                    <h3>${userDisplayName} ${isAnyAd ? '<span class="ad-badge">Ad</span>' : ''}</h3>  
                    <span>${userDisplayUsername}</span>  
                </div>  
            </div>  
            <div class="post-date">${formattedDate}</div>  
            ${isVideoPost ? '<div class="video-indicator"><i class="fas fa-video"></i> Video</div>' : ''}
        </div>  
        
        <div class="post-content">  
            ${isAnyAd ? `<div class="ad-container">` : ''}
            
            ${processedContent ? `<p class="${isAnyAd ? 'ad-content-text' : ''}">${processedContent}</p>` : ''}
            
            ${renderMediaForThisPost(post)}
            
            ${isAnyAd ? `</div>` : ''}
        </div>  
        
        ${isAnyAd ? `
            <div class="post-stats ad-stats">
                <span class="ad-label">${adLabel}</span>
                ${post.likes > 0 ? `<span class="ad-likes">${post.likes.toLocaleString()} reactions</span>` : ''}
            </div>
        ` : `  
            <div class="post-stats">  
                <span>${post.likes.toLocaleString()} likes</span>  
                ${mentionedUsers.length > 0  
                    ? `<span class="mentions-info">  
                        Mentions ${mentionedUsers.length} user${  
                          mentionedUsers.length > 1 ? 's' : ''  
                      }  
                       </span>`  
                    : ''  
                }  
                ${mentionsCurrentUser  
                    ? `<span class="mention-you">Mentions you!</span>`  
                    : ''  
                }  
            </div>  
            
            <div class="post-actions-buttons">  
                <button class="action-btn ${currentUser?.likedPosts?.has(postId) ? 'liked' : ''}" data-action="like" data-post-id="${postId}">  
                    <i class="fas fa-heart"></i> Like  
                </button>  
                <button class="action-btn share-btn" data-action="share" data-post-id="${postId}">  
                    <i class="fas fa-share-alt"></i> Share  
                </button>  
            </div>  
        `}  
    `;
    
    if (adType === 'API_AD') {
        const adContainer = postElement.querySelector(`#ad-${postId}`);
        if (adContainer) {
            adContainer.innerHTML = `
<script type="text/javascript">
  atOptions = {
  	'key' : 'd00f4eb20818128f182b8839788682d3',
  	'format' : 'iframe',
  	'height' : 250,
  	'width' : 300,
  	'params' : {}
  };
</script>
<script
  type="text/javascript"
  src="https://www.highperformanceformat.com/d00f4eb20818128f182b8839788682d3/invoke.js"
></script>
`;
        }
        return postElement;
    }
    
    const videoElement = postElement.querySelector('.secure-video');
    if (videoElement && videoObserver) {
        videoObserver.observe(videoElement);
    }
    
    if (!isAnyAd) {
        const likeBtn = postElement.querySelector('[data-action="like"]');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => handleLike(postId, likeBtn));
        }
        
        const shareBtn = postElement.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                sharePost(postId);
            });
        }
    } else if (adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        const likeBtn = postElement.querySelector('[data-action="like"]');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                if (!currentUser || currentUser.isGuest) {
                    alert('Please login to react to ads!');
                    return;
                }
                handleLike(postId, likeBtn);
            });
        }
    }
    
    if (!isAnyAd || adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        const userInfo = postElement.querySelector('.post-user');
        if (userInfo) {
            userInfo.addEventListener('click', () =>
                showUserProfile(post.username, post.name)
            );
        }
    }
    
    if (!isAnyAd || adType === 'CREATOR_AD' || adType === 'TOPIC_AD') {
        postElement.querySelectorAll('.mention').forEach(mention => {
            mention.addEventListener('click', e => {
                e.stopPropagation();
                const username = mention.dataset.username;
                const userExists = DATABASEPOSTS.some(p => p.username === username);
                userExists
                    ? showUserProfile(username, username)
                    : alert(`User @${username} not found`);
            });
        });
    }

    return postElement;
}

// ==================== DATE FUNCTIONS ====================

function parseCustomDate(dateString) {
    try {
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        if (!dateString || typeof dateString !== 'string') {
            console.warn('Invalid date input:', dateString);
            return new Date();
        }
        
        const parts = dateString.split(' ');
        
        if (parts.length < 4) {
            console.warn('Invalid date format, expecting 4 parts:', dateString);
            return new Date();
        }
        
        const monthAbbr = parts[0];
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const timePart = parts[3];
        
        const month = months[monthAbbr];
        if (month === undefined) {
            console.warn('Invalid month:', monthAbbr);
            return new Date();
        }
        
        const timeMatch = timePart.match(/(\d+):(\d+)(AM|PM)/i);
        if (!timeMatch) {
            console.warn('Invalid time format, trying alternative:', timePart);
            const altParts = dateString.split(' ');
            if (altParts.length >= 5) {
                const altTimePart = altParts[3] + altParts[4];
                const altTimeMatch = altTimePart.match(/(\d+):(\d+)(AM|PM)/i);
                if (altTimeMatch) {
                    let hours = parseInt(altTimeMatch[1]);
                    const minutes = parseInt(altTimeMatch[2]);
                    const ampm = altTimeMatch[3].toUpperCase();
                    
                    if (ampm === 'PM' && hours < 12) hours += 12;
                    if (ampm === 'AM' && hours === 12) hours = 0;
                    
                    return new Date(year, month, day, hours, minutes);
                }
            }
            return new Date(year, month, day);
        }
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3].toUpperCase();
        
        if (ampm === 'PM' && hours < 12) {
            hours += 12;
        }
        if (ampm === 'AM' && hours === 12) {
            hours = 0;
        }
        
        return new Date(year, month, day, hours, minutes);
    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return new Date();
    }
}

function formatDateToCustom(date) {
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        return `${month} ${day} ${year} ${hours}:${minutes}${ampm}`;
    } catch (error) {
        console.error('Error formatting date:', date, error);
        return 'Invalid Date';
    }
}

function formatJoinedDate(date) {
    try {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${month} ${year}`;
    } catch (error) {
        console.error('Error formatting joined date:', date, error);
        return 'Recently';
    }
}

// ==================== SETUP & INITIALIZATION ====================

function setupEventListeners() {
    // Initialize video observer
    videoObserver = initializeVideoObserver();
    
    // Auth event listeners
    if (elements.authTabs) {
        elements.authTabs.forEach(tab => {
            tab.addEventListener('click', switchAuthTab);
        });
    }
    
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', handleSignup);
    }
    
    if (elements.createNewAccount) {
        elements.createNewAccount.addEventListener('click', () => {
            document.querySelector('.auth-tab[data-tab="signup"]').click();
        });
    }
    
    // Theme toggle
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Search functionality
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', handleSearch);
        elements.searchInput.addEventListener('focus', showSearchResults);
    }
    
    if (elements.searchToggle) {
        elements.searchToggle.addEventListener('click', toggleSearchBar);
    }
    
    // Modal controls
    if (elements.closeProfileModal) {
        elements.closeProfileModal.addEventListener('click', () => {
            elements.profileModal.classList.remove('active');
        });
    }
    
    if (elements.closePostModal) {
        elements.closePostModal.addEventListener('click', () => {
            elements.postModal.classList.remove('active');
            resetPostForm();
        });
    }
    
    // Load more posts
    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.addEventListener('click', loadMorePosts);
    }
    
    // Profile links
    if (elements.profileLink) {
        elements.profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showOwnProfile();
        });
    }
    
    if (elements.mobileProfileLink) {
        elements.mobileProfileLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showOwnProfile();
            closeMobileMenu();
        });
    }
    
    if (elements.bottomProfileBtn) {
        elements.bottomProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showOwnProfile();
        });
    }
    
    // Video navigation event listeners
    if (elements.desktopVideosLink) {
        elements.desktopVideosLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleVideoNavigation();
        });
    }
    
    if (elements.mobileVideosLink) {
        elements.mobileVideosLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleVideoNavigation();
            closeMobileMenu();
        });
    }
    
    if (elements.bottomreelsBtn) {
        elements.bottomreelsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleVideoNavigation();
        });
    }
    
    // Home navigation event listeners
    if (elements.desktopHomeLink) {
        elements.desktopHomeLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (isVideoMode) {
                showAllPosts();
            } else {
                // Already on home, just update nav state
                updateVideoNavState(false);
            }
        });
    }
    
    if (elements.mobileHomeLink) {
        elements.mobileHomeLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (isVideoMode) {
                showAllPosts();
            }
            closeMobileMenu();
            updateVideoNavState(false);
        });
    }
    
    if (document.getElementById('bottomHomeBtn')) {
        document.getElementById('bottomHomeBtn').addEventListener('click', function(e) {
            e.preventDefault();
            if (isVideoMode) {
                showAllPosts();
            }
            updateVideoNavState(false);
        });
    }
    
    // Mobile menu
    if (elements.mobileMenuToggle) {
        elements.mobileMenuToggle.addEventListener('click', openMobileMenu);
    }
    
    if (elements.closeMobileMenu) {
        elements.closeMobileMenu.addEventListener('click', closeMobileMenu);
    }
    
    // User menu
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleUserMenu);
    }
    
    if (elements.logoutLink) {
        elements.logoutLink.addEventListener('click', handleLogout);
    }
    
    if (elements.mobileLogoutLink) {
        elements.mobileLogoutLink.addEventListener('click', handleLogout);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (elements.profileModal && e.target === elements.profileModal) {
            elements.profileModal.classList.remove('active');
        }
        if (elements.postModal && e.target === elements.postModal) {
            elements.postModal.classList.remove('active');
            resetPostForm();
        }
        
        if (elements.userMenu && !elements.userMenu.contains(e.target) && e.target !== elements.menuToggle) {
            elements.userMenu.classList.remove('active');
        }
        
        if (elements.searchResults && !elements.searchResults.contains(e.target) && e.target !== elements.searchInput) {
            elements.searchResults.style.display = 'none';
        }
    });
    
    // Close search on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.searchResults) {
                elements.searchResults.style.display = 'none';
            }
            document.querySelector('.search-bar')?.classList.remove('active');
        }
    });
}
// ==================== POST FETCHING FUNCTIONS ====================

const JSON_URL = "database_827_383_294_103_759_927_953.json";

function fetchPosts() {
    console.log("Fetching posts from:", JSON_URL);

    if (elements.postsFeed) {
        elements.postsFeed.innerHTML = `
            <div class="loading-state" style="text-align: center; padding: 3rem;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="color: var(--text-secondary);">Loading posts...</p>
            </div>
        `;
    }

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });

    const fetchPromise = fetch(JSON_URL + "?v=" + Date.now(), {
        cache: "no-store",
        headers: {
            'Accept': 'application/json'
        }
    });

    Promise.race([fetchPromise, timeoutPromise])
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.text();
        })
        .then(text => {
            console.log("Raw response received, length:", text.length);
            
            let cleanedText = text.trim();
            
            if (!cleanedText.endsWith('}') && !cleanedText.endsWith(']')) {
                console.warn("JSON might be truncated, attempting to fix...");
                const lastBrace = cleanedText.lastIndexOf('}');
                const lastBracket = cleanedText.lastIndexOf(']');
                const cutIndex = Math.max(lastBrace, lastBracket);
                
                if (cutIndex > 0) {
                    cleanedText = cleanedText.substring(0, cutIndex + 1);
                    console.log("Trimmed to:", cleanedText.length, "chars");
                }
            }
            
            try {
                const data = JSON.parse(cleanedText);
                console.log("JSON parsed successfully");
                
                const postsArray = extractPostsFromJSON(data);
                console.log("Extracted posts:", postsArray.length);
                
                if (postsArray.length > 0) {
                    console.log("Sample post:", postsArray[0]);
                    processPosts(postsArray);
                } else {
                    console.error("No posts extracted");
                    renderEmptyState();
                }
            } catch (parseError) {
                console.error("JSON parse error:", parseError.message);
                renderErrorState("Invalid JSON format received from server");
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            renderErrorState(err.message || "Failed to load posts");
            processPosts([]);
        });
}

function extractPostsFromJSON(data) {
    if (!data) {
        return [];
    }

    console.log("Data type:", typeof data);
    
    if (Array.isArray(data)) {
        return data;
    }
    
    // Check if data has a posts property
    if (data.posts && Array.isArray(data.posts)) {
        return data.posts;
    }
    
    // Check for other possible structures
    if (data.data && Array.isArray(data.data)) {
        return data.data;
    }
    
    return [];
}

function processPosts(postsArray) {
    console.log('Processing posts data...');

    if (!Array.isArray(postsArray)) {
        postsArray = [];
    }

    const validPosts = postsArray.filter(post => {
        if (!post || typeof post !== 'object') {
            console.log('Skipping invalid post object:', post);
            return false;
        }
        
        const hasRequired = post.name && post.username && post.datePost;
        if (!hasRequired) {
            console.log('Skipping post missing required fields:', post);
            return false;
        }
        
        try {
            const parsedDate = parseCustomDate(post.datePost);
            const isValidDate = !isNaN(parsedDate.getTime());
            if (!isValidDate) {
                console.log('Skipping post with invalid date:', post.datePost);
            }
            return isValidDate;
        } catch {
            return false;
        }
    });

    if (validPosts.length === 0) {
        renderEmptyState();
        return;
    }

    DATABASEPOSTS = [...validPosts];

    if (elements.postsFeed) elements.postsFeed.innerHTML = '';
    displayedPosts.clear();
    displayedVideoPosts.clear();
    currentPage = 0;
    videoPage = 0;
    allPosts = [];
    videoPosts = [];
    isVideoMode = false;

    console.log(`Processing ${DATABASEPOSTS.length} valid posts`);

    initializePosts();
    loadTrendingTopics();
    loadSuggestedProfiles();
    
    // Load posts based on current mode
    if (isVideoMode) {
        showVideoPosts();
    } else {
        loadPosts();
    }

    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.style.display = 'block';
        elements.loadMoreBtn.disabled = false;
        elements.loadMoreBtn.textContent = 'Load More';
    }

    console.log('Posts processing complete.');
}

function renderEmptyState() {
    if (!elements.postsFeed) return;

    elements.postsFeed.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
            <i class="fas fa-newspaper" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--text-secondary);">No posts available</h3>
            <p style="font-size: 0.95rem; max-width: 300px; margin: 0 auto 1rem;">No posts could be loaded from the server.</p>
            <button onclick="fetchPosts()" class="btn btn-secondary" style="margin-top: 1rem;">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;

    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.style.display = "none";
    }
}

function renderErrorState(message) {
    if (!elements.postsFeed) return;

    elements.postsFeed.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 3rem 1rem; color: var(--danger);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Failed to Load Posts</h3>
            <p style="margin: 1rem 0; color: var(--text-secondary);">${message}</p>
            <button onclick="fetchPosts()" class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
}

// ==================== PROFILE FUNCTIONS ====================

function getMentionsForUser(username) {
    const userMentions = [];
    
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) return userMentions;
    
    for (let i = 0; i < DATABASEPOSTS.length; i++) {
        const post = DATABASEPOSTS[i];
        
        if (post.content && post.content.includes(`@${username}`)) {
            userMentions.push({
                postId: `meko-${post.username.toLowerCase()}-reco${DATABASEPOSTS.length - i}`,
                post: post,
                datePost: parseCustomDate(post.datePost),
                mentionedBy: post.username,
                topic: post.topic || ''
            });
        }
    }
    
    userMentions.sort((a, b) => b.datePost - a.datePost);
    return userMentions;
}

function showOwnProfile() {
    if (!currentUser || currentUser.isGuest) {
        alert('Please login to view your profile!');
        return;
    }
    
    showUserProfile(currentUser.username, currentUser.name, true);
}

function showUserProfile(username, name, isOwnProfile = false) {
    console.log(`Showing profile for ${username} (isOwnProfile: ${isOwnProfile})`);
    
    const userPosts = DATABASEPOSTS.filter(post => 
        post.username === username || 
        post.username.toLowerCase() === username.toLowerCase()
    );
    
    console.log(`Found ${userPosts.length} posts for ${username}`);
    
    if (userPosts.length === 0 && !isOwnProfile) {
        alert('User not found or has no posts');
        return;
    }
    
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
    const postsCount = userPosts.length;
    const userMentions = getMentionsForUser(username);
    const averageLikes = postsCount > 0 ? Math.round(totalLikes / postsCount) : 0;
    
    let joinedDate = 'Recently';
    if (userPosts.length > 0) {
        const sortedPosts = [...userPosts].sort((a, b) => {
            const dateA = parseCustomDate(a.datePost);
            const dateB = parseCustomDate(b.datePost);
            return dateA - dateB;
        });
        
        const firstPost = sortedPosts[0];
        if (firstPost && firstPost.datePost) {
            joinedDate = formatJoinedDate(parseCustomDate(firstPost.datePost));
        }
    }
    
    const profileHeader = document.getElementById('profileHeader');
    if (profileHeader) {
        profileHeader.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff&size=128" alt="${name}">
                    ${isOwnProfile ? '<div class="profile-badge">You</div>' : ''}
                </div>
                <h2 id="profileName">${name}</h2>
                <div class="profile-username">@${username}</div>
                
         <div class="profile-stats ${postsCount > 99999 || totalLikes > 99999 || averageLikes > 99999 ? 'compact' : ''}">
    <div class="stat-item">
        <span class="stat-value ${postsCount > 99999 ? 'stat-value--large' : ''}">${postsCount}</span>
        <span class="stat-label">Posts</span>
    </div>
    <div class="stat-item">
        <span class="stat-value ${totalLikes > 99999 ? 'stat-value--large' : ''}">${totalLikes.toLocaleString()}</span>
        <span class="stat-label">Total Likes</span>
    </div>
    <div class="stat-item">
        <span class="stat-value ${userMentions.length > 99999 ? 'stat-value--large' : ''}">${userMentions.length}</span>
        <span class="stat-label">Mentions</span>
    </div>
    ${averageLikes > 0 ? `
    <div class="stat-item">
        <span class="stat-value ${averageLikes > 99999 ? 'stat-value--large' : ''}">${averageLikes.toLocaleString()}</span>
        <span class="stat-label">Avg. Likes</span>
    </div>
    ` : ''}
</div>
                
                <div class="profile-meta">
                    <div class="joined-date">
                        <i class="fas fa-calendar-alt"></i>
                        Joined ${joinedDate}
                    </div>
                    ${isOwnProfile ? `
                    <div class="profile-actions">
                        <button class="btn-secondary" onclick="handleLogout()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    const profileNameElement = document.getElementById('profileName');
    if (profileNameElement) profileNameElement.textContent = name;
    
    const profilePosts = document.getElementById('profilePosts');
    if (profilePosts) {
        profilePosts.innerHTML = '';
        
        const tabsHTML = `
        <div class="profile-tabs-container">
  <button class="profile-tab active" data-tab="posts">
    <i class="fas fa-newspaper"></i>
    <span class="tab-label">Posts</span>
    <span>(${postsCount})</span>
  </button>
  
  <button class="profile-tab" data-tab="mentions">
    <i class="fas fa-at"></i>
    <span class="tab-label">Mentions</span>
    <span>(${userMentions.length})</span>
  </button>
  
  ${isOwnProfile ? `
  <button class="profile-tab" data-tab="liked">
    <i class="fas fa-heart"></i>
    <span class="tab-label">Liked</span>
    <span>(${currentUser?.likedPosts?.size || 0})</span>
  </button>` : ''}
</div>
            </div>
            <div class="profile-content">
                <div class="tab-content active" id="postsTab"></div>
                <div class="tab-content" id="mentionsTab"></div>
                ${isOwnProfile ? `<div class="tab-content" id="likedTab"></div>` : ''}
            </div>
        `;
        
        profilePosts.innerHTML = tabsHTML;
        
        const postsTab = document.getElementById('postsTab');
        if (userPosts.length > 0) {
            const userPostsSorted = [...userPosts].sort((a, b) => {
                const dateA = parseCustomDate(a.datePost);
                const dateB = parseCustomDate(b.datePost);
                return dateB - dateA;
            });
            
            userPostsSorted.forEach((post) => {
                const foundPost = allPosts.find(p => 
                    p.username === post.username && 
                    p.datePost === post.datePost &&
                    p.content === post.content
                );
                
                if (foundPost) {
                    const postElement = createPostElement(foundPost, foundPost.id);
                    postsTab.appendChild(postElement);
                } else {
                    const tempId = Date.now() + Math.random();
                    const postElement = createPostElement(post, tempId);
                    postsTab.appendChild(postElement);
                }
            });
        } else {
            postsTab.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>No posts yet</h3>
                    <p>${isOwnProfile ? 'You haven\'t posted anything yet.' : 'This user hasn\'t posted anything yet.'}</p>
                    ${isOwnProfile ? `
                    <button class="btn btn-primary" onclick="showPostModal()">
                        <i class="fas fa-plus"></i> Create Your First Post
                    </button>
                    ` : ''}
                </div>
            `;
        }
        
        const mentionsTab = document.getElementById('mentionsTab');
        if (userMentions.length > 0) {
            userMentions.forEach(mention => {
                const foundPost = allPosts.find(p => p.id === mention.postId);
                if (foundPost) {
                    const postElement = createPostElement(foundPost, mention.postId);
                    mentionsTab.appendChild(postElement);
                }
            });
        } else {
            mentionsTab.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-at"></i>
                    <h3>No mentions yet</h3>
                    <p>${isOwnProfile ? 'You haven\'t been mentioned yet.' : 'This user hasn\'t been mentioned yet.'}</p>
                </div>
            `;
        }
        
        if (isOwnProfile) {
            const likedTab = document.getElementById('likedTab');
            const likedPosts = Array.from(currentUser?.likedPosts || []);
            
            if (likedPosts.length > 0) {
                const likedPostObjects = likedPosts
                    .map(postId => allPosts.find(p => p.id === postId))
                    .filter(post => post);
                
                likedPostObjects.forEach(post => {
                    const postElement = createPostElement(post, post.id);
                    likedTab.appendChild(postElement);
                });
            } else {
                likedTab.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heart"></i>
                        <h3>No liked posts yet</h3>
                        <p>Posts you like will appear here.</p>
                    </div>
                `;
            }
        }
        
        // Add event listeners for profile tabs
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
    }
    
    if (elements.profileModal) {
        elements.profileModal.classList.add('active');
    }
}

// ==================== TRENDING & SUGGESTIONS FUNCTIONS ====================

function loadTrendingTopics() {
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) {
        console.log('No posts data available for trending topics');
        return;
    }
    
    const topics = {};
    
    DATABASEPOSTS.forEach(post => {
        if (post.topic) {
            topics[post.topic] = (topics[post.topic] || 0) + 1;
        }
    });
    
    const sortedTopics = Object.entries(topics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (elements.trendingList) {
        elements.trendingList.innerHTML = '';
        
        sortedTopics.forEach(([topic, count]) => {
            const topicItem = document.createElement('div');
            topicItem.className = 'trending-item';
            topicItem.innerHTML = `
                <div style="font-weight: 500; color: var(--text-primary);">#${topic}</div>
                <span>${count} posts</span>
            `;
            
            topicItem.addEventListener('click', () => {
                filterPostsByTopic(topic);
            });
            
            elements.trendingList.appendChild(topicItem);
        });
    }
}

function loadSuggestedProfiles() {
    if (!DATABASEPOSTS || DATABASEPOSTS.length === 0) {
        console.log('No posts data available for suggested profiles');
        return;
    }
    
    const uniqueUsers = new Map();
    
    DATABASEPOSTS.forEach(post => {
        if (!uniqueUsers.has(post.username)) {
            const userPosts = DATABASEPOSTS.filter(p => p.username === post.username);
            const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
            
            uniqueUsers.set(post.username, {
                name: post.name,
                username: post.username,
                postsCount: userPosts.length,
                totalLikes: totalLikes
            });
        }
    });
    
    const suggestedProfiles = Array.from(uniqueUsers.values())
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, 5);
    
    if (elements.suggestedProfiles) {
        elements.suggestedProfiles.innerHTML = '';
        
        suggestedProfiles.forEach(user => {
            const profileItem = document.createElement('div');
            profileItem.className = 'profile-item';
            profileItem.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e3a8a&color=fff" alt="${user.name}">
                <div class="profile-info">
                    <h4>${user.name}</h4>
                    <span>${user.postsCount} posts • ${user.totalLikes.toLocaleString()} likes</span>
                </div>
            `;
            
            profileItem.addEventListener('click', () => {
                showUserProfile(user.username, user.name);
            });
            
            elements.suggestedProfiles.appendChild(profileItem);
        });
    }
}

function loadSearchHistory() {
    if (!currentUser || !currentUser.searchHistory || !elements.searchHistory) return;
    
    elements.searchHistory.innerHTML = '';
    
    currentUser.searchHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        let icon = 'history';
        if (item.type === 'profile') icon = 'user';
        if (item.type === 'topic') icon = 'hashtag';
        if (item.type === 'post') icon = 'file-alt';
        
        historyItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${icon}" style="color: var(--text-muted);"></i>
                <div style="flex: 1; min-width: 0;">
                    <div style="color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; text-transform: capitalize;">${item.type}</div>
                </div>
            </div>
        `;
        
        historyItem.addEventListener('click', () => {
            if (item.type === 'profile') {
                showUserProfile(item.identifier, item.name);
            } else if (item.type === 'topic') {
                filterPostsByTopic(item.identifier);
            } else if (item.type === 'post') {
                const postElement = document.querySelector(`[data-post-id="${item.identifier}"]`);
                if (postElement) {
                    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
        
        elements.searchHistory.appendChild(historyItem);
    });
}

function filterPostsByTopic(topic) {
    if (!elements.postsFeed) return;
    
    elements.postsFeed.innerHTML = '';
    currentPage = 0;
    displayedPosts.clear();
    isVideoMode = false;
    updateVideoNavState(false);
    
    const filteredPosts = allPosts.filter(post => post.topic === topic);
    
    if (filteredPosts.length === 0) {
        elements.postsFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-hashtag"></i>
                <h3>No posts with topic #${topic}</h3>
                <p>No posts found with this topic.</p>
            </div>
        `;
        return;
    }
    
    filteredPosts.forEach(post => {
        const postElement = createPostElement(post, post.id);
        elements.postsFeed.appendChild(postElement);
        displayedPosts.add(post.id);
    });
    
    if (elements.loadMoreBtn) {
        elements.loadMoreBtn.style.display = 'none';
    }
}

// Note: The rest of the functions (handleLike, sharePost, search functions, profile functions, etc.)
// remain the same as in your original code. They have been omitted here for brevity,
// but you should keep them in your actual main.js file.

// Initialize the app
function initializeApp() {
    console.log("Initializing app...");
    
    if (!elements || !elements.postsFeed) {
        console.error("DOM elements not ready yet!");
        setTimeout(initializeApp, 100);
        return;
    }
    
    setupEventListeners();
    setupTheme();
    processUrlParameters();
    fetchPosts();
    checkAuth();
}

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
